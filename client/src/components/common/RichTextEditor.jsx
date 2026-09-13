import { useEffect, useRef, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import {
  Bold,
  Italic,
  Heading2,
  Code,
  SquareCode,
  Link2,
  ListOrdered,
  List,
  Quote,
  ImageIcon,
  Loader2,
  X,
  Unlink
} from 'lucide-react'
import { uploadApi } from '../../api.js'
import { compressPostImage } from '../../utils/imageCompressor.js'
import './RichTextEditor.css'

export default function RichTextEditor({
  content = '',
  onChange,
  placeholder = 'Write your content...',
  minHeight = '180px',
  onError,
  className = '',
  toolbarPosition = 'top',
  autoFocus = false,
  actions = null,
  onUploadingChange = null
}) {
  const [uploading, setUploading] = useState(false)
  const [showLinkModal, setShowLinkModal] = useState(false)
  const [linkText, setLinkText] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const [savedRange, setSavedRange] = useState(null)
  const fileInputRef = useRef(null)
  const uploadHandlerRef = useRef(null)
  const editorRef = useRef(null)

  useEffect(() => {
    if (onUploadingChange) {
      onUploadingChange(uploading)
    }
  }, [uploading, onUploadingChange])

  const handleUploadImage = useCallback(
    async (file) => {
      if (!file || !file.type.startsWith('image/')) {
        if (onError) onError('Please select a valid image file.')
        return
      }
      setUploading(true)
      if (onUploadingChange) onUploadingChange(true)
      try {
        const compressed = await compressPostImage(file)
        const res = await uploadApi.uploadImage(compressed)
        const url = res?.imageUrl || res?.url
        if (url && editorRef.current) {
          editorRef.current.chain().focus().setImage({ src: url, alt: file.name || 'image' }).run()
        }
      } catch (err) {
        if (onError) onError(err.message || 'Image upload failed. Try again.')
      } finally {
        setUploading(false)
        if (onUploadingChange) onUploadingChange(false)
      }
    },
    [onError, onUploadingChange]
  )

  uploadHandlerRef.current = handleUploadImage

  const [, setTick] = useState(0)
  const forceUpdate = useCallback(() => setTick((t) => (t + 1) % 1000000), [])

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3]
        }
      }),
      Placeholder.configure({
        placeholder
      }),
      Image.configure({
        inline: false,
        allowBase64: false
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: {
          target: '_blank',
          rel: 'noopener noreferrer'
        }
      })
    ],
    content,
    autofocus: autoFocus,
    editorProps: {
      attributes: {
        class: 'glug-tiptap-content'
      },
      handlePaste: (view, event) => {
        const items = Array.from(event.clipboardData?.items || [])
        const imageItem = items.find((it) => it.type.startsWith('image/'))
        if (imageItem) {
          event.preventDefault()
          const file = imageItem.getAsFile()
          if (file && uploadHandlerRef.current) {
            uploadHandlerRef.current(file)
          }
          return true
        }
        return false
      },
      handleDrop: (view, event) => {
        const files = Array.from(event.dataTransfer?.files || [])
        const imageFile = files.find((f) => f.type.startsWith('image/'))
        if (imageFile) {
          event.preventDefault()
          if (uploadHandlerRef.current) {
            uploadHandlerRef.current(imageFile)
          }
          return true
        }
        return false
      }
    },
    onSelectionUpdate: () => {
      forceUpdate()
    },
    onUpdate: ({ editor: ed }) => {
      forceUpdate()
      if (onChange) {
        const html = ed.isEmpty ? '' : ed.getHTML()
        onChange(html)
      }
    }
  })
  editorRef.current = editor

  useEffect(() => {
    if (!editor) return
    const current = editor.getHTML()
    if (!content && !editor.isEmpty) {
      editor.commands.setContent('', false)
    } else if (content && content !== current && !editor.isFocused) {
      editor.commands.setContent(content, false)
    }
  }, [content, editor])

  const openLinkModal = useCallback(() => {
    if (!editor) return
    const { from, to, empty } = editor.state.selection
    const selectedText = empty ? '' : editor.state.doc.textBetween(from, to, ' ')
    const currentHref = editor.getAttributes('link').href || ''
    setSavedRange({ from, to, empty })
    setLinkText(selectedText)
    setLinkUrl(currentHref)
    setShowLinkModal(true)
  }, [editor])

  const handleApplyLink = useCallback(
    (e) => {
      e?.preventDefault()
      if (!editor) return

      let formattedUrl = linkUrl.trim()
      if (!formattedUrl) {
        if (editor.isActive('link')) {
          editor.chain().focus().extendMarkRange('link').unsetLink().run()
        }
        setShowLinkModal(false)
        return
      }

      if (
        !/^https?:\/\//i.test(formattedUrl) &&
        !/^mailto:/i.test(formattedUrl) &&
        !/^tel:/i.test(formattedUrl)
      ) {
        formattedUrl = 'https://' + formattedUrl
      }

      const textToUse = linkText.trim() || formattedUrl

      if (savedRange && !savedRange.empty) {
        const originalText = editor.state.doc.textBetween(savedRange.from, savedRange.to, ' ')
        if (originalText === textToUse) {
          editor
            .chain()
            .focus()
            .setTextSelection(savedRange)
            .extendMarkRange('link')
            .setLink({ href: formattedUrl })
            .run()
        } else {
          editor
            .chain()
            .focus()
            .setTextSelection(savedRange)
            .insertContent({
              type: 'text',
              text: textToUse,
              marks: [{ type: 'link', attrs: { href: formattedUrl } }]
            })
            .run()
        }
      } else {
        editor
          .chain()
          .focus()
          .insertContent({
            type: 'text',
            text: textToUse,
            marks: [{ type: 'link', attrs: { href: formattedUrl } }]
          })
          .run()
      }

      editor.chain().focus().unsetMark('link').run()
      setShowLinkModal(false)
      setLinkText('')
      setLinkUrl('')
      setSavedRange(null)
      forceUpdate()
    },
    [editor, linkText, linkUrl, savedRange, forceUpdate]
  )

  const handleRemoveLink = useCallback(() => {
    if (!editor) return
    if (savedRange && !savedRange.empty) {
      editor.chain().focus().setTextSelection(savedRange).extendMarkRange('link').unsetLink().run()
    } else {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
    }
    setShowLinkModal(false)
    setLinkText('')
    setLinkUrl('')
    setSavedRange(null)
    forceUpdate()
  }, [editor, savedRange, forceUpdate])

  if (!editor) {
    return null
  }

  const renderToolbar = () => (
    <div className="rte-toolbar">
      <div className="rte-btn-group">
        <button
          type="button"
          className={`rte-btn ${editor.isActive('bold') ? 'is-active' : ''}`}
          onClick={() => {
            editor.chain().focus().toggleBold().run()
            forceUpdate()
          }}
          title="Bold (Ctrl+B)"
        >
          <Bold size={14} />
        </button>
        <button
          type="button"
          className={`rte-btn ${editor.isActive('italic') ? 'is-active' : ''}`}
          onClick={() => {
            editor.chain().focus().toggleItalic().run()
            forceUpdate()
          }}
          title="Italic (Ctrl+I)"
        >
          <Italic size={14} />
        </button>
        <button
          type="button"
          className={`rte-btn ${editor.isActive('heading', { level: 2 }) ? 'is-active' : ''}`}
          onClick={() => {
            editor.chain().focus().toggleHeading({ level: 2 }).run()
            forceUpdate()
          }}
          title="Heading"
        >
          <Heading2 size={14} />
        </button>
      </div>

      <div className="rte-divider" />

      <div className="rte-btn-group">
        <button
          type="button"
          className={`rte-btn ${editor.isActive('code') ? 'is-active' : ''}`}
          onClick={() => {
            editor.chain().focus().toggleCode().run()
            forceUpdate()
          }}
          title="Inline Code"
        >
          <Code size={14} />
        </button>
        <button
          type="button"
          className={`rte-btn ${editor.isActive('codeBlock') ? 'is-active' : ''}`}
          onClick={() => {
            editor.chain().focus().toggleCodeBlock().run()
            forceUpdate()
          }}
          title="Code Block"
        >
          <SquareCode size={14} />
        </button>
        <button
          type="button"
          className={`rte-btn ${editor.isActive('link') ? 'is-active' : ''}`}
          onClick={openLinkModal}
          title="Insert or Edit Link (Ctrl+K)"
        >
          <Link2 size={14} />
        </button>
      </div>

      <div className="rte-divider" />

      <div className="rte-btn-group">
        <button
          type="button"
          className={`rte-btn ${editor.isActive('bulletList') ? 'is-active' : ''}`}
          onClick={() => {
            editor.chain().focus().toggleBulletList().run()
            forceUpdate()
          }}
          title="Bullet List"
        >
          <List size={14} />
        </button>
        <button
          type="button"
          className={`rte-btn ${editor.isActive('orderedList') ? 'is-active' : ''}`}
          onClick={() => {
            editor.chain().focus().toggleOrderedList().run()
            forceUpdate()
          }}
          title="Numbered List"
        >
          <ListOrdered size={14} />
        </button>
        <button
          type="button"
          className={`rte-btn ${editor.isActive('blockquote') ? 'is-active' : ''}`}
          onClick={() => {
            editor.chain().focus().toggleBlockquote().run()
            forceUpdate()
          }}
          title="Blockquote"
        >
          <Quote size={14} />
        </button>
      </div>

      <div className="rte-divider" />

      <div className="rte-btn-group">
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          style={{ display: 'none' }}
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleUploadImage(file)
            e.target.value = ''
          }}
        />
        <button
          type="button"
          className="rte-btn rte-upload-btn"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          title="Upload image (<1MB auto-compressed)"
        >
          {uploading ? <Loader2 size={14} className="spin-icon" /> : <ImageIcon size={14} />}
          <span>{uploading ? 'Uploading...' : 'Image'}</span>
        </button>
      </div>
    </div>
  )

  return (
    <div
      className={`glug-rich-editor ${className}`}
      onKeyDown={(e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
          e.preventDefault()
          openLinkModal()
        }
      }}
    >
      {toolbarPosition === 'top' && renderToolbar()}
      <div
        className="rte-editor-wrapper"
        style={{ minHeight }}
        onClick={() => {
          if (!editor.isFocused) {
            editor.chain().focus().run()
          }
        }}
      >
        <EditorContent editor={editor} />
      </div>
      {toolbarPosition === 'bottom' && (
        <div className="rte-bottom-toolbar-wrap">
          {renderToolbar()}
          {actions && (
            <div className="rte-actions-slot">
              {typeof actions === 'function' ? actions({ uploading }) : actions}
            </div>
          )}
        </div>
      )}

      {showLinkModal &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="rte-link-modal-overlay"
            onClick={() => setShowLinkModal(false)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setShowLinkModal(false)
            }}
          >
            <div className="rte-link-modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="rte-link-header">
                <div className="rte-link-title">
                  <Link2 size={16} />
                  <span>{editor.isActive('link') ? 'Edit Link' : 'Insert Link'}</span>
                </div>
                <button
                  type="button"
                  className="rte-link-close-btn"
                  onClick={() => setShowLinkModal(false)}
                  aria-label="Close"
                >
                  <X size={15} />
                </button>
              </div>

              <form onSubmit={handleApplyLink} className="rte-link-form">
                <div className="rte-link-field">
                  <label className="rte-link-label">Text to display</label>
                  <input
                    type="text"
                    className="rte-link-input"
                    placeholder="e.g. Website or guide"
                    value={linkText}
                    onChange={(e) => setLinkText(e.target.value)}
                    autoFocus={!linkText}
                  />
                </div>

                <div className="rte-link-field">
                  <label className="rte-link-label">Link URL</label>
                  <input
                    type="text"
                    className="rte-link-input"
                    placeholder="https://example.com"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    autoFocus={!!linkText}
                    required
                  />
                </div>

                <div className="rte-link-actions">
                  {editor.isActive('link') && (
                    <button
                      type="button"
                      className="rte-link-btn rte-link-btn-danger"
                      onClick={handleRemoveLink}
                    >
                      <Unlink size={14} />
                      <span>Unlink</span>
                    </button>
                  )}
                  <button
                    type="button"
                    className="rte-link-btn rte-link-btn-cancel"
                    onClick={() => setShowLinkModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="rte-link-btn rte-link-btn-primary">
                    {editor.isActive('link') ? 'Save' : 'Insert Link'}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}
    </div>
  )
}

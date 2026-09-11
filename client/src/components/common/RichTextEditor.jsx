import { useEffect, useRef, useState, useCallback } from 'react'
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
  Loader2
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
  actions = null
}) {
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)
  const uploadHandlerRef = useRef(null)

  const handleUploadImage = useCallback(
    async (file) => {
      if (!file || !file.type.startsWith('image/')) {
        if (onError) onError('Please select a valid image file.')
        return
      }
      setUploading(true)
      try {
        const compressed = await compressPostImage(file)
        const res = await uploadApi.uploadImage(compressed)
        const url = res?.imageUrl || res?.url
        if (url && editor) {
          editor.chain().focus().setImage({ src: url, alt: file.name || 'image' }).run()
        }
      } catch (err) {
        if (onError) onError(err.message || 'Image upload failed. Try again.')
      } finally {
        setUploading(false)
      }
    },
    [onError]
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
    onTransaction: () => {
      forceUpdate()
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

  useEffect(() => {
    if (!editor) return
    const current = editor.getHTML()
    if (!content && !editor.isEmpty) {
      editor.commands.setContent('', false)
    } else if (content && content !== current && !editor.isFocused) {
      editor.commands.setContent(content, false)
    }
  }, [content, editor])

  const setLink = useCallback(() => {
    if (!editor) return
    const previousUrl = editor.getAttributes('link').href || ''
    const url = window.prompt('Enter link URL:', previousUrl || 'https://')
    if (url === null) return
    if (url.trim() === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url.trim() }).run()
  }, [editor])

  if (!editor) {
    return null
  }

  const renderToolbar = () => (
    <div className="rte-toolbar">
      <div className="rte-btn-group">
        <button
          type="button"
          className={`rte-btn ${editor.isActive('bold') ? 'is-active' : ''}`}
          onClick={() => editor.chain().focus().toggleBold().run()}
          title="Bold (Ctrl+B)"
        >
          <Bold size={14} />
        </button>
        <button
          type="button"
          className={`rte-btn ${editor.isActive('italic') ? 'is-active' : ''}`}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title="Italic (Ctrl+I)"
        >
          <Italic size={14} />
        </button>
        <button
          type="button"
          className={`rte-btn ${editor.isActive('heading', { level: 2 }) ? 'is-active' : ''}`}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
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
          onClick={() => editor.chain().focus().toggleCode().run()}
          title="Inline Code"
        >
          <Code size={14} />
        </button>
        <button
          type="button"
          className={`rte-btn ${editor.isActive('codeBlock') ? 'is-active' : ''}`}
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          title="Code Block"
        >
          <SquareCode size={14} />
        </button>
        <button
          type="button"
          className={`rte-btn ${editor.isActive('link') ? 'is-active' : ''}`}
          onClick={setLink}
          title="Insert Link"
        >
          <Link2 size={14} />
        </button>
      </div>

      <div className="rte-divider" />

      <div className="rte-btn-group">
        <button
          type="button"
          className={`rte-btn ${editor.isActive('bulletList') ? 'is-active' : ''}`}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          title="Bullet List"
        >
          <List size={14} />
        </button>
        <button
          type="button"
          className={`rte-btn ${editor.isActive('orderedList') ? 'is-active' : ''}`}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          title="Numbered List"
        >
          <ListOrdered size={14} />
        </button>
        <button
          type="button"
          className={`rte-btn ${editor.isActive('blockquote') ? 'is-active' : ''}`}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
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
    <div className={`glug-rich-editor ${className}`}>
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
          {actions && <div className="rte-actions-slot">{actions}</div>}
        </div>
      )}
    </div>
  )
}

import Chip from '../common/Chip.jsx'
import { Flame, Clock, Trophy, X } from 'lucide-react'

export default function CategoryFilter({
  categories,
  activeCategory,
  onSelectCategory,
  activeSort = 'hot',
  onSelectSort,
  activeTag = '',
  onClearTag,
}) {
  return (
    <div className="forum-controls-bar">
      <div className="category-filter">
        <Chip
          label="All"
          active={activeCategory === ''}
          onClick={() => onSelectCategory('')}
        />
        {categories.map((cat) => (
          <Chip
            key={cat}
            label={cat.charAt(0).toUpperCase() + cat.slice(1)}
            active={activeCategory === cat}
            onClick={() => onSelectCategory(cat)}
          />
        ))}
      </div>

      <div className="forum-sort-and-filter">
        {activeTag && (
          <div className="active-tag-badge">
            <span>Tag: #{activeTag}</span>
            <button type="button" onClick={onClearTag} title="Clear tag filter">
              <X size={13} />
            </button>
          </div>
        )}

        {onSelectSort && (
          <div className="sort-selector">
            <button
              type="button"
              className={`sort-tab ${activeSort === 'hot' ? 'active' : ''}`}
              onClick={() => onSelectSort('hot')}
            >
              <Flame size={14} />
              <span>Hot</span>
            </button>
            <button
              type="button"
              className={`sort-tab ${activeSort === 'new' ? 'active' : ''}`}
              onClick={() => onSelectSort('new')}
            >
              <Clock size={14} />
              <span>New</span>
            </button>
            <button
              type="button"
              className={`sort-tab ${activeSort === 'top' ? 'active' : ''}`}
              onClick={() => onSelectSort('top')}
            >
              <Trophy size={14} />
              <span>Top</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}


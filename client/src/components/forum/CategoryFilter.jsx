import Chip from '../common/Chip.jsx'

export default function CategoryFilter({ categories, activeCategory, onSelectCategory }) {
  return (
    <div className="category-filter">
      <Chip
        label="All"
        active={activeCategory === ''}
        onClick={() => onSelectCategory('')}
      />
      {categories.map((cat) => (
        <Chip
          key={cat}
          label={cat}
          active={activeCategory === cat}
          onClick={() => onSelectCategory(cat)}
        />
      ))}
    </div>
  )
}

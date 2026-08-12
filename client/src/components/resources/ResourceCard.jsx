import Card from '../common/Card.jsx'

export default function ResourceCard({ title, description, items }) {
  return (
    <Card>
      <h2>{title}</h2>
      <p>{description}</p>
      {items && items.length > 0 && (
        <ul className="resource-list">
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )}
    </Card>
  )
}

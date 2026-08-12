import Card from '../common/Card.jsx'

export default function FeatureCard({ title, description }) {
  return (
    <Card>
      <h2>{title}</h2>
      <p>{description}</p>
    </Card>
  )
}

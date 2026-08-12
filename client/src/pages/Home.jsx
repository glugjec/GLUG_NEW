import Hero from '../components/home/Hero.jsx'
import FeatureCard from '../components/home/FeatureCard.jsx'
import LinuxTerminal from '../components/linux/LinuxTerminal.jsx'
import CodeBackground from '../components/layout/CodeBackground.jsx'

const features = [
  {
    title: 'What is GLUG?',
    description:
      'GLUG (GNU/Linux User Group) is a community hub where students learn about open source, Linux and programming — and discuss everything that matters to them.',
  },
  {
    title: 'Learn',
    description:
      'Head to the Resources page for curated study material on Linux fundamentals, the command line, and system administration.',
  },
  {
    title: 'Discuss',
    description:
      'The Forum is the heart of the community. Ask questions, share knowledge, and connect with fellow students.',
  },
]

export default function Home() {
  return (
    <>
      <CodeBackground />
      <section className="page">
      <Hero
        title="Welcome to GLUG"
        subtitle="A community built by students, for students — learn Linux, share ideas, and grow together."
        primaryAction={{ to: '/resources', label: 'Explore Resources' }}
        secondaryAction={{ to: '/forum', label: 'Join the Forum' }}
      >
        <LinuxTerminal username="student" hostname="glug" height={400} />
      </Hero>

      <div className="cards">
        {features.map((feature) => (
          <FeatureCard
            key={feature.title}
            title={feature.title}
            description={feature.description}
          />
        ))}
      </div>
      </section>
    </>
  )
}
// RoadGallery.jsx — three short "journal lines" at the bottom of the page.
//
// The road scene at the top (RoadHero.jsx) carries the illustration; this
// strip just restates what the app is for, set in the serif display face.

const LINES = [
  'Carpool smarter. Everyone pays their fair share.',
  'Live gas prices, updated daily, so the math is right.',
  'Don’t let gas costs get in the way of a great trip.',
]

export default function RoadGallery() {
  return (
    <section className="road-gallery" aria-label="Why Split Tank">
      <div className="road-gallery-inner">
        {LINES.map(line => <p key={line}>{line}</p>)}
      </div>
    </section>
  )
}

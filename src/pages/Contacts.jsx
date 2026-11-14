import { useDocumentTitle } from '../lib/storage.js'

const CONTACTS_DATA = [
  {
    group: 'Faculty Officials',
    people: [
      { name: 'Miss. Rina (V.P.)', role: 'Faculty Vice President', phone: '+234 901 345 7672' },
      { name: 'Sir Ediaoghene T.E. (LLB2 C.R.)', role: 'LLB2 Course Rep.', phone: '+234 811 513 1055' },
    ]
  },
  {
    group: 'Acting Class Officials',
    people: [
      { name: 'Simeon (C.R.)', role: 'Acting Course Rep', phone: '07062605368' },
      { name: 'Grandly Dee (A.C.R.)', role: 'Asst. Acting Course Rep', phone: '+234 706 173 9098' },
    ]
  },
  {
    group: 'Class Members',
    people: [
      { name: '-----', role: 'Class Member', phone: null },
    ]
  }
]

export default function Contacts() {
  useDocumentTitle('Contacts')

  const handleMessage = (person) => {
    if (!person.phone) {
      alert(`Phone number for ${person.name} (${person.role}) is not yet available.`)
      return
    }
    // Strips out spaces and the plus sign for WhatsApp routing
    const cleanPhone = person.phone.replace(/[^0-9]/g, '')
    window.open(`https://wa.me/${cleanPhone}`, '_blank')
  }

  return (
    <div className="view">
      <h3 className="section-title" style={{ marginTop: 4 }}>Class Contacts</h3>
      
      {CONTACTS_DATA.map((section) => (
        <div key={section.group} style={{ marginBottom: 24 }}>
          <div className="contact-group-title">{section.group}</div>
          
          {section.people.map((person, i) => {
            const initials = person.name
              .split(' ')
              .filter(w => w && w[0] === w[0].toUpperCase() && w !== '-----')
              .slice(0, 2)
              .map(w => w[0])
              .join('') || '?'

            return (
              <div key={`${person.name}-${i}`} className="contact">
                <div className="avatar" style={{ opacity: person.name === '-----' ? 0.5 : 1 }}>
                  {initials}
                </div>
                <div className="contact-info">
                  <div className="contact-name" style={{ opacity: person.name === '-----' ? 0.5 : 1 }}>
                    {person.name}
                  </div>
                  <div className="contact-role">{person.role}</div>
                </div>
                <button 
                  className={`btn sm ${person.phone ? 'btn-gold' : 'ghost'}`} 
                  onClick={() => handleMessage(person)}
                >
                  Message
                </button>
              </div>
            )
          })}
        </div>
      ))}
      
      <div className="note" style={{ marginTop: 20 }}>
        Directory updated by the Acting Course Rep. If your number is missing, please reach out to the admin.
      </div>
    </div>
  )
}

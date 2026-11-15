function escapeHtml(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]))
}

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function inline(text) {
  let s = escapeHtml(text)
  s = s.replace(/`([^`\n]+)`/g, '<code>$1</code>')
  s = s.replace(/==([^=\n]+)==/g, '<mark>$1</mark>')
  s = s.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>')
  s = s.replace(/(^|[^*\w])\*([^*\n]+)\*/g, '$1<em>$2</em>')
  s = s.replace(
    /\[\[([^\]\n]+)\]\]|\[\^([a-zA-Z0-9]+)\]|\[([^\]\n]+)\]\((https?:\/\/[^\s)]+)\)/g,
    (m, xref, fnref, ltext, lurl) => {
      if (xref !== undefined) return `<a class="xref" href="#" data-xref="${xref}">${xref}</a>`
      if (fnref !== undefined) return `<sup class="fnref" id="fnref-${fnref}"><a href="#fn-${fnref}">${fnref}</a></sup>`
      return `<a href="${lurl}" target="_blank" rel="noopener noreferrer">${ltext}</a>`
    }
  )
  return s
}

const blockRules = [
  {
    // Custom Cover Page Block
    test: (lines) => /^:::\s*cover/i.test(lines[0]),
    render: (lines) => {
      // Extract content between ::: cover and :::
      let content = lines.slice(1).filter(l => !/^:::\s*$/.test(l)).join('\n')
      return `<div class="cover-page">${inline(content).replace(/\n/g, '<br>')}</div>`
    }
  },
  {
    // Custom TOC Block
    test: (lines) => /^:::\s*toc/i.test(lines[0]),
    render: (lines) => {
      let items = lines.slice(1).filter(l => l.trim().startsWith('- ') && !/^:::\s*$/.test(l))
      let html = '<div class="toc-page"><h2 class="toc-heading">Table of Contents</h2><div class="toc-list">'
      items.forEach(item => {
        let text = item.replace(/^-\s+/, '')
        // If it has a number like "1.1", separate it
        let match = text.match(/^(\d+(\.\d+)*)\s+(.*)$/)
        if (match) {
           html += `<div class="toc-row"><span class="toc-num">${match[1]}</span><span class="toc-text">${inline(match[3])}</span></div>`
        } else {
           html += `<div class="toc-row"><span class="toc-text">${inline(text)}</span></div>`
        }
      })
      return html + '</div></div>'
    }
  },
  {
    test: (lines) => /^#{1,4}\s+\S/.test(lines[0]),
    render: (lines) => {
      const m = lines[0].match(/^(#{1,4})\s+(.+)$/)
      const lvl = m[1].length
      const text = m[2]
      const id = slugify(text.replace(/\d+(\.\d+)*\s*/, ''))
      const num = text.match(/^(\d+(?:\.\d+)*)\s+(.+)$/)
      
      let html = ''
      if (num) {
        html = `<h${lvl} id="${id}" class="numbered"><span class="secnum">${num[1]}</span>${inline(num[2])}</h${lvl}>`
      } else {
        html = `<h${lvl} id="${id}">${inline(text)}</h${lvl}>`
      }
      
      if (lines.length > 1) {
        html += `<p>${inline(lines.slice(1).join('\n')).replace(/\n/g, '<br>')}</p>`
      }
      return html
    }
  },
  {
    test: (lines) => lines.length === 1 && /^---\s*p?\.?\s*\d+\s*---$/i.test(lines[0]),
    render: (lines) => {
      const n = lines[0].match(/\d+/)[0]
      return `<div class="page-marker" id="page-${n}">Page ${n}</div>`
    }
  },
  {
    test: (lines) => /^::\s+/.test(lines[0]),
    render: (lines) => {
      const body = lines[0].replace(/^::\s+/, '') + (lines.length > 1 ? '\n' + lines.slice(1).join('\n') : '')
      return `<p class="lead">${inline(body).replace(/\n/g, '<br>')}</p>`
    }
  },
  {
    test: (lines) => /^!!!\s+/.test(lines[0]),
    render: (lines) => {
      const body = lines[0].replace(/^!!!\s+/, '') + (lines.length > 1 ? '\n' + lines.slice(1).join('\n') : '')
      return `<div class="callout">${inline(body).replace(/\n/g, '<br>')}</div>`
    }
  },
  {
    test: (lines) => /^(Facts|Issue|Holding|Ratio|Decision|Reasoning|Judgment|Held)\s*:\s*/i.test(lines[0]),
    render: (lines) => {
      const m = lines[0].match(/^(Facts|Issue|Holding|Ratio|Decision|Reasoning|Judgment|Held)\s*:\s*(.*)$/i)
      const label = m[1]
      const body = (m[2] || '') + (lines.length > 1 ? '\n' + lines.slice(1).join('\n') : '')
      return `<div class="brief-block"><span class="brief-label">${escapeHtml(label)}</span><div class="brief-text">${inline(body).replace(/\n/g, '<br>')}</div></div>`
    }
  },
  {
    test: (lines) => /^§\s+/.test(lines[0]),
    render: (lines) => {
      const label = lines[0].replace(/^§\s+/, '').trim()
      const id = 'sec-' + slugify(label)
      const rest = lines.slice(1).join('\n').trim()
      let html = `<div class="statute-sec" id="${id}"><span class="statute-sec-num">${inline(label)}</span>`
      if (rest) html += `<p>${inline(rest).replace(/\n/g, '<br>')}</p>`
      return html + '</div>'
    }
  },
  {
    test: (lines) => lines.every((l) => /^>\s?/.test(l)),
    render: (lines) => {
      let inner = lines.map((l) => l.replace(/^>\s?/, ''))
      let cite = ''
      const last = inner[inner.length - 1]
      if (/^[—–-]\s/.test(last)) {
        cite = `<cite>${inline(last.replace(/^[—–-]\s+/, ''))}</cite>`
        inner = inner.slice(0, -1)
      }
      return `<blockquote><p>${inline(inner.join('\n')).replace(/\n/g, '<br>')}</p>${cite}</blockquote>`
    }
  },
  {
    test: (lines) => lines.length >= 2 && lines[0].indexOf('|') === 0 && /^\|?[\s\-:|]+\|?$/.test(lines[1]) && lines[1].indexOf('-') > -1,
    render: (lines) => {
      const cells = (row) => row.replace(/^\||\|$/g, '').split('|').map((c) => c.trim())
      const header = cells(lines[0])
      const rows = lines.slice(2).map(cells)
      let html = '<table><thead><tr>'
      header.forEach((h) => { html += `<th>${inline(h)}</th>` })
      html += '</tr></thead><tbody>'
      rows.forEach((row) => {
        html += '<tr>'
        row.forEach((c) => { html += `<td>${inline(c)}</td>` })
        html += '</tr>'
      })
      return html + '</tbody></table>'
    }
  },
  {
    test: (lines) => lines.length >= 2 && lines.every((l) => /^\([a-z]\)\s/.test(l)),
    render: (lines) => '<ol class="lettered">' + lines.map((l) => `<li>${inline(l.replace(/^\([a-z]\)\s+/, ''))}</li>`).join('') + '</ol>'
  },
  {
    test: (lines) => {
      if (lines.length < 2) return false
      if (!lines.every((l) => /^\((?:i|ii|iii|iv|v|vi|vii|viii|ix|x|xi|xii)\)\s/.test(l))) return false
      return lines.some((l) => /^\((?:ii|iii|iv|vi|vii|viii|ix|xi|xii)\)\s/.test(l))
    },
    render: (lines) => '<ol class="roman">' + lines.map((l) => `<li>${inline(l.replace(/^\((?:i|ii|iii|iv|v|vi|vii|viii|ix|x|xi|xii)\)\s+/, ''))}</li>`).join('') + '</ol>'
  },
  {
    test: (lines) => lines.every((l) => /^-\s+/.test(l)),
    render: (lines) => '<ul>' + lines.map((l) => `<li>${inline(l.replace(/^-\s+/, ''))}</li>`).join('') + '</ul>'
  },
  {
    test: (lines) => lines.every((l) => /^\d+\.\s+/.test(l)),
    render: (lines) => '<ol>' + lines.map((l) => `<li>${inline(l.replace(/^\d+\.\s+/, ''))}</li>`).join('') + '</ol>'
  },
  {
    test: () => true,
    render: (lines) => `<p>${inline(lines.join('\n')).replace(/\n/g, '<br>')}</p>`
  }
]

export function parseLegalMD(md) {
  if (!md || typeof md !== 'string') return ''
  const footnotes = {}
  let text = md.replace(/^\[\^([a-zA-Z0-9]+)\]:\s*(.+)$/gm, (m, id, ft) => {
    footnotes[id] = ft.trim()
    return ''
  })

  const blocks = text.replace(/\r\n/g, '\n').split(/\n{2,}/)
  const out = []
  for (const block of blocks) {
    const lines = block.split('\n').filter((l) => l.trim().length)
    if (!lines.length) continue
    for (const rule of blockRules) {
      if (rule.test(lines)) {
        out.push(rule.render(lines))
        break
      }
    }
  }

  const fnKeys = Object.keys(footnotes).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
  if (fnKeys.length) {
    out.push(
      '<section class="footnotes"><h4>Notes</h4><ol>' +
        fnKeys.map((k) => `<li id="fn-${k}">${inline(footnotes[k])} <a href="#fnref-${k}" class="fn-back" aria-label="Back to text">↩</a></li>`).join('') +
      '</ol></section>'
    )
  }
  return out.join('\n')
}

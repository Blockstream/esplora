#!/usr/bin/env node

const reSingular = / \(singular\)$/
    , rePlural   = / \(plural\)$/

require('pofile').load('/dev/stdin', (err, po) => {
  if (err) throw err

  const tran = po.items.filter(item => item.msgstr[0] != '' || item.msgstr.length > 1)
    .reduce((T, { msgid, msgstr }) => {
      if (msgstr.length && !(msgstr.length == 1 && msgid === msgstr[0])) {
        const isSingular = reSingular.test(msgid), isPlural = rePlural.test(msgid)
        if (isSingular || isPlural) {
          const msgid_s = msgid.replace(reSingular, '').replace(rePlural, '')
          T[msgid_s] || (T[msgid_s] = [])
          T[msgid_s][isSingular?0:1] = msgstr[0]
        } else {
          T[msgid] = msgstr[0]
        }
      }
      return T
    }, {})

  console.log(JSON.stringify(tran, null, 2))
})

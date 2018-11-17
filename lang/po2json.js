#!/usr/bin/env
require('pofile').load('/dev/stdin', (err, po) => {
  if (err) throw err

  const tran = po.items.filter(item => item.msgstr[0] != '' || item.msgstr.length > 1)
    .reduce((T, { msgid, msgid_plural, msgstr }) =>
      ({ ...T, [msgid]: msgid_plural ? [ null, ...msgstr ] : msgstr[0] }), {})

  console.log(JSON.stringify(tran, null, 2))
})

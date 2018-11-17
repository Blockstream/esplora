import Snabbdom from 'snabbdom-pragma'
import layout from './layout'

const formatError = err =>
  (err.message && err.message.startsWith('Request has been terminated'))
? 'We encountered an error. Please try again later.'
: err.toString()

export const error = ({ t, error }) => layout(<div>
  <div className="jumbotron jumbotron-fluid">
    <div className="container"><h1>{ t(formatError(error)) }</h1></div>
  </div>
</div>
, { t })

export const notFound = S => error({ ...S, error: 'Page Not Found' })

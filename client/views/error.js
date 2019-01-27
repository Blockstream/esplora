import Snabbdom from 'snabbdom-pragma'
import layout from './layout'

const formatError = err =>
  (err.message && err.message.startsWith('Request has been terminated'))
? 'We encountered an error. Please try again later.'
: err.toString()

export const error = ({ t, error, errorId }) => layout(<div>
  <div className="jumbotron jumbotron-fluid">
    <div className="container" data-errorId={errorId}><h1>{ t(formatError(error)) }</h1></div>
  </div>
</div>
, { t })

export const notFound = S => error({ ...S, error: 'Page Not Found', errorId: 'not-found' })

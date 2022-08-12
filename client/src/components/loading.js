import Snabbdom from 'snabbdom-pragma'

export default (size) => 
        <div className="spinner">
            <div className={`ring ${size}`}></div>
        </div>
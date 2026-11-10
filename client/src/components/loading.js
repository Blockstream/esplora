export default (size, { immediate } = {}) =>
        <div className="loading-container">
            <div className={`spinner${immediate ? ' spinner-immediate' : ''}`}>
                <div className={`ring ${size}`}></div>
            </div>
        </div>
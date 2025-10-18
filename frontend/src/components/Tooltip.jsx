import { useState, useEffect } from 'react';

function Tooltip({ text, position = 'top', children, show = false, delay = 0 }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => setVisible(true), delay);
      return () => clearTimeout(timer);
    } else {
      setVisible(false);
    }
  }, [show, delay]);

  return (
    <div className="tooltip-wrapper">
      {children}
      {visible && (
        <div className={`tooltip tooltip-${position}`}>
          <div className="tooltip-content">
            {text}
          </div>
          <div className="tooltip-arrow"></div>
        </div>
      )}
    </div>
  );
}

export default Tooltip;



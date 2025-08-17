// Icon components
const Plus = () => React.createElement('span', {}, '+');

const X = ({ size }) => React.createElement('span', { 
    style: { 
        fontSize: size ? `${size}px` : '14px',
        width: size ? `${size + 6}px` : '20px',
        height: size ? `${size + 6}px` : '20px',
        borderRadius: '50%',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        color: '#ef4444',
        fontWeight: 'bold',
        lineHeight: '1'
    }
}, '×');

const Shuffle = ({ size }) => React.createElement('span', { 
    style: { fontSize: size ? `${size}px` : '16px' }
}, '🎲');

const Upload = ({ size }) => React.createElement('span', { 
    style: { fontSize: size ? `${size}px` : '16px' }
}, '📁');

const ChefHat = () => React.createElement('svg', {
    width: '36',
    height: '36',
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: '2',
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    className: 'text-gray-600'
},
    React.createElement('path', { d: 'M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6Z' }),
    React.createElement('line', { x1: '6', y1: '17', x2: '18', y2: '17' })
);

const Calendar = () => React.createElement('svg', {
    width: '20',
    height: '20',
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: '2',
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    className: 'text-gray-600'
},
    React.createElement('rect', { x: '3', y: '4', width: '18', height: '18', rx: '2', ry: '2' }),
    React.createElement('line', { x1: '16', y1: '2', x2: '16', y2: '6' }),
    React.createElement('line', { x1: '8', y1: '2', x2: '8', y2: '6' }),
    React.createElement('line', { x1: '3', y1: '10', x2: '21', y2: '10' })
);

const Cloud = () => React.createElement('svg', {
    width: '16',
    height: '16',
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: '2',
    strokeLinecap: 'round',
    strokeLinejoin: 'round'
},
    React.createElement('path', { d: 'M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z' })
);

// Export icons to global scope
window.Icons = {
    Plus,
    X,
    Shuffle,
    Upload,
    ChefHat,
    Calendar,
    Cloud
};
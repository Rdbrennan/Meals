// Utility functions
const getCurrentWeekDates = () => {
    const today = new Date();
    const currentDay = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - (currentDay === 0 ? 6 : currentDay - 1));
    
    const weekDates = [];
    for (let i = 0; i < 7; i++) {
        const date = new Date(monday);
        date.setDate(monday.getDate() + i);
        weekDates.push(date);
    }
    return weekDates;
};

const formatDate = (date) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[date.getMonth()]} ${date.getDate()}`;
};

const getWeekRange = () => {
    const dates = getCurrentWeekDates();
    const startDate = formatDate(dates[0]);
    const endDate = formatDate(dates[6]);
    return `Week of ${startDate} - ${endDate}`;
};

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// Export utilities to global scope
window.Utils = {
    getCurrentWeekDates,
    formatDate,
    getWeekRange,
    days
};
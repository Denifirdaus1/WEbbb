// Supabase configuration
const supabaseUrl = "https://rrlmejrtlqnfaavyrrtf.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJybG1lanJ0bHFuZmFhdnlycnRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgyMzI5NzUsImV4cCI6MjA2MzgwODk3NX0.8uC7og_bfk2C-Ok6KNGAY5Ej-nz_wBz07-94BG1rUZY";

// Initialize Supabase client
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// Chart instance
let registrationChart;

// Days of the week in order (Sunday to Saturday)
const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Function to get day of week from date (0 = Sunday, 6 = Saturday)
function getDayOfWeek(dateString) {
    return new Date(dateString).getDay();
}

// Function to format date to YYYY-MM-DD
function formatDate(date) {
    return date.toISOString().split('T')[0];
}

// Function to get date range for current week
function getCurrentWeekRange() {
    const today = new Date();
    const currentDay = today.getDay(); // 0 = Sunday, 6 = Saturday
    
    // Calculate start of week (Sunday)
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - currentDay);
    startOfWeek.setHours(0, 0, 0, 0);
    
    // Calculate end of week (Saturday)
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    
    return {
        start: formatDate(startOfWeek),
        end: formatDate(endOfWeek)
    };
}

// Function to fetch user registration data
async function fetchRegistrationData() {
    try {
        const weekRange = getCurrentWeekRange();
        
        // Fetch users registered in current week
        const { data: users, error } = await supabase
            .from('users')
            .select('created_at')
            .gte('created_at', weekRange.start)
            .lte('created_at', weekRange.end)
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Error fetching data:', error);
            return null;
        }

        return users;
    } catch (error) {
        console.error('Error:', error);
        return null;
    }
}

// Function to fetch total users count
async function fetchTotalUsers() {
    try {
        const { count, error } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true });

        if (error) {
            console.error('Error fetching total users:', error);
            return 0;
        }

        return count || 0;
    } catch (error) {
        console.error('Error:', error);
        return 0;
    }
}

// Function to process data for chart
function processChartData(users) {
    // Initialize data array with 0 for each day
    const dailyRegistrations = new Array(7).fill(0);
    
    // Count registrations per day
    users.forEach(user => {
        const dayIndex = getDayOfWeek(user.created_at);
        dailyRegistrations[dayIndex]++;
    });
    
    return dailyRegistrations;
}

// Function to get today's registrations
function getTodayRegistrations(users) {
    const today = new Date();
    const todayString = formatDate(today);
    
    return users.filter(user => {
        const userDate = formatDate(new Date(user.created_at));
        return userDate === todayString;
    }).length;
}

// Function to calculate weekly average
function getWeeklyAverage(dailyData) {
    const total = dailyData.reduce((sum, count) => sum + count, 0);
    return Math.round(total / 7 * 10) / 10; // Round to 1 decimal place
}

// Function to create the chart
function createChart(dailyData) {
    const ctx = document.getElementById('registrationChart').getContext('2d');
    
    // Destroy existing chart if it exists
    if (registrationChart) {
        registrationChart.destroy();
    }
    
    registrationChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: daysOfWeek,
            datasets: [{
                label: 'Daily Registrations',
                data: dailyData,
                borderColor: '#5271ff',
                backgroundColor: 'rgba(82, 113, 255, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#5271ff',
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2,
                pointRadius: 6,
                pointHoverRadius: 8,
                pointHoverBackgroundColor: '#4959e0',
                pointHoverBorderColor: '#ffffff',
                pointHoverBorderWidth: 3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        font: {
                            family: 'Poppins',
                            size: 14,
                            weight: '600'
                        },
                        color: '#1a1a1a',
                        padding: 20
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(26, 26, 26, 0.9)',
                    titleColor: '#ffffff',
                    bodyColor: '#ffffff',
                    borderColor: '#5271ff',
                    borderWidth: 1,
                    cornerRadius: 8,
                    displayColors: false,
                    titleFont: {
                        family: 'Poppins',
                        size: 14,
                        weight: '600'
                    },
                    bodyFont: {
                        family: 'Poppins',
                        size: 13
                    },
                    callbacks: {
                        title: function(context) {
                            return context[0].label;
                        },
                        label: function(context) {
                            const count = context.parsed.y;
                            return `${count} user${count !== 1 ? 's' : ''} registered`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1,
                        font: {
                            family: 'Poppins',
                            size: 12
                        },
                        color: '#666'
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)',
                        drawBorder: false
                    }
                },
                x: {
                    ticks: {
                        font: {
                            family: 'Poppins',
                            size: 12,
                            weight: '500'
                        },
                        color: '#666'
                    },
                    grid: {
                        display: false
                    }
                }
            },
            elements: {
                point: {
                    hoverRadius: 8
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            }
        }
    });
}

// Function to update statistics
function updateStatistics(users, dailyData) {
    const totalUsers = document.getElementById('totalUsers');
    const todayRegistrations = document.getElementById('todayRegistrations');
    const weeklyAverage = document.getElementById('weeklyAverage');
    
    // Update total users
    fetchTotalUsers().then(total => {
        totalUsers.textContent = total.toLocaleString();
    });
    
    // Update today's registrations
    const todayCount = getTodayRegistrations(users);
    todayRegistrations.textContent = todayCount;
    
    // Update weekly average
    const avgCount = getWeeklyAverage(dailyData);
    weeklyAverage.textContent = avgCount;
}

// Function to show loading state
function showLoading() {
    const chartContainer = document.querySelector('.chart-container');
    chartContainer.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #666;">
            <div style="text-align: center;">
                <div style="width: 40px; height: 40px; border: 3px solid #f3f3f3; border-top: 3px solid #5271ff; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 15px;"></div>
                <p>Loading registration data...</p>
            </div>
        </div>
        <style>
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        </style>
    `;
}

// Function to show error state
function showError() {
    const chartContainer = document.querySelector('.chart-container');
    chartContainer.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #666; text-align: center;">
            <div>
                <p style="font-size: 1.1rem; margin-bottom: 10px;">Unable to load registration data</p>
                <p style="font-size: 0.9rem;">Please check your connection and try again</p>
                <button onclick="loadChartData()" style="margin-top: 15px; background: #5271ff; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer;">
                    Retry
                </button>
            </div>
        </div>
    `;
}

// Function to restore chart canvas
function restoreChartCanvas() {
    const chartContainer = document.querySelector('.chart-container');
    chartContainer.innerHTML = '<canvas id="registrationChart"></canvas>';
}

// Main function to load and display chart data
async function loadChartData() {
    showLoading();
    
    try {
        const users = await fetchRegistrationData();
        
        if (!users) {
            showError();
            return;
        }
        
        // Restore canvas element
        restoreChartCanvas();
        
        // Process data and create chart
        const dailyData = processChartData(users);
        createChart(dailyData);
        updateStatistics(users, dailyData);
        
    } catch (error) {
        console.error('Error loading chart data:', error);
        showError();
    }
}

// Initialize chart when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Add a small delay to ensure all elements are rendered
    setTimeout(() => {
        loadChartData();
    }, 500);
});

// Refresh data every 5 minutes
setInterval(loadChartData, 5 * 60 * 1000);
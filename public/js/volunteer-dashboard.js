// Volunteer Dashboard JavaScript

// Accept a donation request
function acceptRequest(donationId) {
    if (confirm('Are you sure you want to accept this donation request?')) {
        fetch(`/accept-donation/${donationId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showNotification('Donation request accepted successfully!', 'success');
                setTimeout(() => {
                    window.location.reload();
                }, 1500);
            } else {
                showNotification('Error accepting donation request', 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showNotification('Error accepting donation request', 'error');
        });
    }
}

// Mark donation as picked up
function markPickedUp(donationId) {
    if (confirm('Confirm that you have picked up this donation?')) {
        fetch(`/volunteer/pickup/${donationId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showNotification('Donation marked as picked up!', 'success');
                setTimeout(() => {
                    window.location.reload();
                }, 1500);
            } else {
                showNotification('Error updating donation status', 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showNotification('Error updating donation status', 'error');
        });
    }
}

// Mark donation as delivered
function markDelivered(donationId) {
    if (confirm('Confirm that you have delivered this donation?')) {
        fetch(`/volunteer/deliver/${donationId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showNotification('Donation marked as delivered!', 'success');
                setTimeout(() => {
                    window.location.reload();
                }, 1500);
            } else {
                showNotification('Error updating donation status', 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showNotification('Error updating donation status', 'error');
        });
    }
}

// View request details
function viewRequestDetails(donationId) {
    window.location.href = `/donation/details/${donationId}`;
}

// Show notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `alert alert-${type === 'error' ? 'danger' : type} alert-dismissible fade show position-fixed`;
    notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    notification.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
}

// Auto-refresh available requests every 60 seconds
setInterval(() => {
    fetch('/api/volunteer/dashboard-data')
        .then(response => response.json())
        .then(data => {
            if (data.newRequests) {
                showNotification('New donation requests available!', 'info');
            }
        })
        .catch(error => {
            console.log('Auto-refresh failed:', error);
        });
}, 60000);

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
    console.log('Volunteer Dashboard initialized');
    
    // Add hover effects to donation cards
    const donationCards = document.querySelectorAll('.donation-request-card');
    donationCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px)';
            this.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
        });
    });
});
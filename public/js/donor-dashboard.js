// Donor Dashboard JavaScript

// View donation details
function viewDonationDetails(donationId) {
    window.location.href = `/donation/details/${donationId}`;
}

// Edit donation (only for pending donations)
function editDonation(donationId) {
    window.location.href = `/donate/edit/${donationId}`;
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

// Track donation progress
function trackDonation(donationId) {
    fetch(`/api/donation/track/${donationId}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showTrackingModal(data.donation);
            } else {
                showNotification('Error loading donation tracking', 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showNotification('Error loading donation tracking', 'error');
        });
}

// Show tracking modal
function showTrackingModal(donation) {
    const modalHtml = `
        <div class="modal fade" id="trackingModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Donation Tracking #${donation.id}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="tracking-timeline">
                            <div class="timeline-item ${donation.status === 'pending' ? 'active' : 'completed'}">
                                <div class="timeline-icon"><i class="fas fa-heart"></i></div>
                                <div class="timeline-content">
                                    <h6>Donation Submitted</h6>
                                    <p class="text-muted">${new Date(donation.created_at).toLocaleString()}</p>
                                </div>
                            </div>
                            <div class="timeline-item ${donation.status === 'assigned' ? 'active' : (donation.status === 'picked_up' || donation.status === 'delivered' ? 'completed' : '')}">
                                <div class="timeline-icon"><i class="fas fa-user-check"></i></div>
                                <div class="timeline-content">
                                    <h6>Volunteer Assigned</h6>
                                    <p class="text-muted">${donation.volunteer_name || 'Waiting for volunteer'}</p>
                                </div>
                            </div>
                            <div class="timeline-item ${donation.status === 'picked_up' ? 'active' : (donation.status === 'delivered' ? 'completed' : '')}">
                                <div class="timeline-icon"><i class="fas fa-truck"></i></div>
                                <div class="timeline-content">
                                    <h6>Pickup Completed</h6>
                                    <p class="text-muted">${donation.pickup_date ? new Date(donation.pickup_date).toLocaleDateString() : 'Pickup scheduled'}</p>
                                </div>
                            </div>
                            <div class="timeline-item ${donation.status === 'delivered' ? 'active' : ''}">
                                <div class="timeline-icon"><i class="fas fa-check-circle"></i></div>
                                <div class="timeline-content">
                                    <h6>Delivered to NGO</h6>
                                    <p class="text-muted">${donation.status === 'delivered' ? 'Delivery completed' : 'Pending delivery'}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Remove existing modal if any
    const existingModal = document.getElementById('trackingModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    const modal = new bootstrap.Modal(document.getElementById('trackingModal'));
    modal.show();
}

// Auto-refresh donation status every 2 minutes
setInterval(() => {
    fetch('/api/donor/dashboard-data')
        .then(response => response.json())
        .then(data => {
            updateDashboardStats(data);
        })
        .catch(error => {
            console.log('Auto-refresh failed:', error);
        });
}, 120000);

// Update dashboard statistics
function updateDashboardStats(data) {
    if (data.stats) {
        const stats = data.stats;
        const statCards = document.querySelectorAll('.stat-content h3');
        
        if (statCards.length >= 4) {
            if (statCards[0].textContent !== stats.total_donations.toString()) {
                statCards[0].textContent = stats.total_donations;
                animateStatCard(statCards[0].parentElement.parentElement);
            }
            if (statCards[1].textContent !== stats.pending.toString()) {
                statCards[1].textContent = stats.pending;
                animateStatCard(statCards[1].parentElement.parentElement);
            }
            if (statCards[2].textContent !== (stats.assigned + stats.picked_up).toString()) {
                statCards[2].textContent = stats.assigned + stats.picked_up;
                animateStatCard(statCards[2].parentElement.parentElement);
            }
            if (statCards[3].textContent !== stats.completed.toString()) {
                statCards[3].textContent = stats.completed;
                animateStatCard(statCards[3].parentElement.parentElement);
            }
        }
    }
}

// Animate stat card when updated
function animateStatCard(card) {
    card.style.transform = 'scale(1.05)';
    card.style.transition = 'transform 0.3s ease';
    
    setTimeout(() => {
        card.style.transform = 'scale(1)';
    }, 300);
}

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
    console.log('Donor Dashboard initialized');
    
    // Add hover effects to action cards
    const actionCards = document.querySelectorAll('.action-card');
    actionCards.forEach(card => {
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
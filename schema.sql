-- CareConnect Database Schema
-- Creates tables for donors, volunteers, NGOs, and donation requests

-- Donors table
CREATE TABLE IF NOT EXISTS donors (
    id SERIAL PRIMARY KEY,
    fullname VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(10),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Volunteers table
CREATE TABLE IF NOT EXISTS volunteers (
    id SERIAL PRIMARY KEY,
    fullname VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(10),
    availability VARCHAR(50) DEFAULT 'available',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- NGOs table
CREATE TABLE IF NOT EXISTS ngos (
    id SERIAL PRIMARY KEY,
    ngo_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    registration_number VARCHAR(100) UNIQUE NOT NULL,
    contact_person VARCHAR(255),
    phone VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(10),
    description TEXT,
    verification_status VARCHAR(20) DEFAULT 'pending',
    document_path VARCHAR(512),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Donation requests table
CREATE TABLE IF NOT EXISTS donation_requests (
    id SERIAL PRIMARY KEY,
    donor_id INTEGER REFERENCES donors(id),
    volunteer_id INTEGER REFERENCES volunteers(id),
    ngo_id INTEGER REFERENCES ngos(id),
    title VARCHAR(255),
    description TEXT,
    
    -- Donation items
    books INTEGER DEFAULT 0,
    clothes INTEGER DEFAULT 0,
    grains INTEGER DEFAULT 0,
    footwear INTEGER DEFAULT 0,
    toys INTEGER DEFAULT 0,
    school_supplies INTEGER DEFAULT 0,
    
    -- Pickup details
    pickup_date DATE,
    pickup_time TIME,
    pickup_address TEXT,
    pickup_city VARCHAR(100),
    pickup_state VARCHAR(100),
    pickup_pincode VARCHAR(10),
    
    -- Contact details
    contact_name VARCHAR(255),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(20),
    contact_phone2 VARCHAR(20),
    
    -- Additional details
    optional_note TEXT,
    proof_image VARCHAR(512),
    
    -- Status tracking
    status VARCHAR(50) DEFAULT 'pending',
    volunteer_name VARCHAR(255),
    volunteer_phone VARCHAR(50),
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    assigned_at TIMESTAMP,
    completed_at TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_donors_email ON donors(email);
CREATE INDEX IF NOT EXISTS idx_volunteers_email ON volunteers(email);
CREATE INDEX IF NOT EXISTS idx_ngos_email ON ngos(email);
CREATE INDEX IF NOT EXISTS idx_donation_requests_status ON donation_requests(status);
CREATE INDEX IF NOT EXISTS idx_donation_requests_donor ON donation_requests(donor_id);
CREATE INDEX IF NOT EXISTS idx_donation_requests_volunteer ON donation_requests(volunteer_id);
CREATE INDEX IF NOT EXISTS idx_donation_requests_ngo ON donation_requests(ngo_id);

-- Legacy table compatibility (for existing code)
-- Keep existing users and ngo_register tables but link to new structure
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    fullname VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ngo_register (
    id SERIAL PRIMARY KEY,
    ngo_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    registration_number VARCHAR(100) UNIQUE NOT NULL,
    contact_person VARCHAR(255),
    phone VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(10),
    description TEXT,
    verification_status VARCHAR(20) DEFAULT 'pending',
    document_path VARCHAR(512),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS donations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    volunteer_id INTEGER REFERENCES volunteers(id),
    ngo_id INTEGER REFERENCES ngos(id),
    title VARCHAR(255),
    description TEXT,
    books INTEGER DEFAULT 0,
    clothes INTEGER DEFAULT 0,
    grains INTEGER DEFAULT 0,
    footwear INTEGER DEFAULT 0,
    toys INTEGER DEFAULT 0,
    "schoolSupplies" INTEGER DEFAULT 0,
    pickup_date DATE,
    pickup_time TIME,
    fname VARCHAR(255),
    lname VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(20),
    phone2 VARCHAR(20),
    flat VARCHAR(255),
    addline TEXT,
    land VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(10),
    optnote TEXT,
    proof_image VARCHAR(512),
    status VARCHAR(50) DEFAULT 'pending',
    volunteer_name VARCHAR(255),
    volunteer_phone VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    assigned_at TIMESTAMP
);
// src/services/apointmentService.ts
import { api } from '@/lib/axios';

export interface AppointmentSlot {
    id: string;
    date: string;
    startTime: string;
    endTime: string;
    isAvailable: boolean;
    type: 'verification' | 'consultation';
    location: string;
}

export interface AppointmentRequest {
    userId: string;
    fullName: string;
    email: string;
    phone: string;
    verificationType: 'candidate' | 'freelancer' | 'company' | 'organization';
    appointmentDate: string;
    appointmentTime: string;
    additionalNotes?: string;
}

export interface Appointment {
    _id: string;
    userId: string;
    fullName: string;
    email: string;
    phone: string;
    verificationType: 'candidate' | 'freelancer' | 'company' | 'organization';
    appointmentDate: string;
    appointmentTime: string;
    status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
    additionalNotes?: string;
    officeLocation: string;
    createdAt: string;
    updatedAt: string;
}

export interface DocumentRequirement {
    id: string;
    title: string;
    description: string;
    required: boolean;
    example?: string;
    notes?: string;
}

class AppointmentService {
    // Get available appointment slots
    async getAvailableSlots(
        date: string,
        verificationType: string
    ): Promise<{ success: boolean; slots: AppointmentSlot[] }> {
        const response = await api.get('/appointments/slots', {
            params: { date, verificationType }
        });
        return response.data;
    }

    // Create appointment
    async createAppointment(data: AppointmentRequest): Promise<{
        success: boolean;
        appointment: Appointment;
        message: string;
    }> {
        const response = await api.post('/appointments', data);
        return response.data;
    }

    // Get user's appointments
    async getUserAppointments(userId: string): Promise<{
        success: boolean;
        appointments: Appointment[];
    }> {
        const response = await api.get(`/appointments/user/${userId}`);
        return response.data;
    }

    // Cancel appointment
    async cancelAppointment(appointmentId: string): Promise<{
        success: boolean;
        message: string;
    }> {
        const response = await api.patch(`/appointments/${appointmentId}/cancel`);
        return response.data;
    }

    // Get office location info
    getOfficeLocation() {
        return {
            address: '22 Meklit Building, Addis Ababa, Ethiopia',
            googleMapsLink: 'https://maps.google.com/?q=22+Meklit+Building+Addis+Ababa',
            workingHours: 'Monday - Friday: 9:00 AM - 5:00 PM',
            contactPhone: '+251 11 123 4567',
            email: 'verification@bananalink.com'
        };
    }
}

export default new AppointmentService();
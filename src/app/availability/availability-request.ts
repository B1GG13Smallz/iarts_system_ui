import { Component, Input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { AvailabilityRequestService } from './availability-request.service';

@Component({
  selector: 'app-availability-request',
  imports: [FormsModule, MatButtonModule],
  templateUrl: './availability-request.html',
  styleUrl: './availability-request.scss',
})
export class AvailabilityRequest {
  @Input() referenceNumber = '';

  protected equipment = '';
  protected readonly message = signal('');

  constructor(private readonly availabilityService: AvailabilityRequestService) {}

  protected submitAvailabilityRequest(): void {
    const cleanEquipment = this.equipment.trim();
    const cleanReference = this.referenceNumber.trim();

    if (!cleanReference || !cleanEquipment) {
      this.message.set('Enter a reference number and equipment name before sending.');
      return;
    }

    this.availabilityService.createRequest(cleanReference, cleanEquipment).subscribe({
      next: () => this.message.set('Availability request sent to admin dashboard.'),
      error: () => this.message.set('Could not send availability request. Please try again.'),
    });
  }
}

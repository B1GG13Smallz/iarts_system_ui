import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { RANK_OPTIONS } from '../models/availability-request.model';
import { AvailabilityRequestService } from '../services/availability-request.service';

@Component({
  selector: 'app-availability-request',
  imports: [FormsModule, MatButtonModule, MatFormFieldModule, MatSelectModule],
  templateUrl: './availability-request.html',
  styleUrl: './availability-request.scss',
})
export class AvailabilityRequest {
  @Input() rank = '';
  @Output() readonly rankChange = new EventEmitter<string>();

  protected equipment = '';
  protected readonly message = signal('');
  protected readonly rankOptions = RANK_OPTIONS;

  constructor(private readonly availabilityService: AvailabilityRequestService) {}

  protected updateRank(value: string): void {
    this.rank = value;
    this.rankChange.emit(value);
  }

  protected submitAvailabilityRequest(): void {
    const cleanEquipment = this.equipment.trim();
    const cleanRank = this.rank.trim();

    if (!cleanRank || !cleanEquipment) {
      this.message.set('Select your rank and enter the equipment name before sending.');
      return;
    }

    this.availabilityService.createRequest(cleanEquipment, cleanRank).subscribe({
      next: () => this.message.set('Availability request sent to admin dashboard.'),
      error: () => this.message.set('Could not send availability request. Please try again.'),
    });
  }
}

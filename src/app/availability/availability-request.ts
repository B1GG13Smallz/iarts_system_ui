import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { AvailabilityRequestService } from './availability-request.service';

interface RankOption {
  value: string;
  titles: string;
}

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
  protected readonly rankOptions: RankOption[] = [
    { value: 'Level 1-2 - Lower skilled', titles: 'Cleaner, General Worker, Groundsman, Messenger' },
    { value: 'Level 3-5 - Skilled', titles: 'Admin Clerk, Registry Clerk, Driver, Secretary, Artisan Assistant' },
    { value: 'Level 6-8 - Highly skilled production', titles: 'Senior Admin Clerk, Admin Officer, Supply Chain Officer, Works Inspector, Artisan, Practitioner' },
    { value: 'Level 9-10 - Highly skilled supervision / junior management', titles: 'Assistant Director, Senior Practitioner, Control Works Inspector, Professional support roles' },
    { value: 'Level 11-12 - Middle Management Service', titles: 'Deputy Director, Senior Specialist, Assistant/Deputy Manager roles' },
    { value: 'Level 13 - Senior Management Service', titles: 'Director' },
    { value: 'Level 14 - Senior Management Service', titles: 'Chief Director' },
    { value: 'Level 15 - Senior Management Service', titles: 'Deputy Director-General' },
    { value: 'Level 16 - Senior Management Service', titles: 'Director-General / Head of Department' },
  ];

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

import { Component, computed, effect, inject, input, model, output, Signal, signal } from '@angular/core';
import { BridgeEventStore } from '../../datastore/logging.store';
import { DatePipe } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { OptionPanelComponent } from '../controls/optionpanel/optionpanel';
import { SelectOption } from '../../models/types';
import { BridgeService } from '../../services/bridge.service';
import { DropdownComponent } from '../controls/dropdown/dropdown';
import { LogLevels } from '../../models/constants';
import { ApplicationService } from '../../services/app.service';
import { SettingsService } from '@/app/services/settings.service';
import { BridgeEvent } from '@/app/models/bridge';
import { Dialog } from '@angular/cdk/dialog';
import { LogViewDialog } from '@/app/components/dialogs/logview/logview';

@Component({
  selector: 'LogView',
  imports: [DatePipe, TranslateModule, OptionPanelComponent, DropdownComponent],
  templateUrl: './logview.html',
  styleUrl: './logview.scss'
})
export class LogView {
  protected readonly eventStore = inject(BridgeEventStore);
  protected readonly bridgeService = inject(BridgeService);
  protected readonly appService = inject(ApplicationService);
  protected readonly settingsService = inject(SettingsService);
  protected readonly dialog = inject(Dialog)

  selectedLevels = signal<string[]>([]);
  serverOptions = signal<SelectOption[]>([]);
  log_level = signal<string>('');
  logViewOpen = model<boolean>(false);
  toggleLogView = output();

  logOptions = signal<SelectOption[]>([]);

  constructor() {
    const selLevel = this.settingsService.getPreference("log_levels");
    this.selectedLevels.set(selLevel);

    effect(() => {
      const bi = this.bridgeService.bridgeInfo;
      if (bi() !== null) {
        this.log_level.set(bi()!.log_level);
        const lvlval = this.log_level();
        if (lvlval !== "") {
          console.log("current", lvlval)
          this.serverOptions = signal([...LogLevels].map(level => {
            return { ...level, isSelected: level.value === lvlval };
          }));
        }
      }
    });

    effect(() => {
      const sl = this.selectedLevels();
      if (sl) {
        this.logOptions = signal([...LogLevels].map(ll => { return { ...ll, isSelected: sl.indexOf(ll.value) > -1 } }));
      } else {
        this.logOptions = signal([...LogLevels]);
      }
    });

  }

  protected readonly reversedEntries = computed(() => {
    const selectedLevels = this.selectedLevels();
    console.log(this.eventStore.entities().length)
    return [...this.eventStore.entities()].reverse().filter(e => selectedLevels ? selectedLevels.indexOf(e.level) > -1 : true);
  });

  toggleView() {
    this.toggleLogView.emit()
  }

  clearLog() {
    this.eventStore.clear();
  }

  changeBridgeLogging(event: any) {
    const options = {
      "advanced": {
        "log_level": event.value
      }
    }
    this.bridgeService.updateOptions({ options });
  }

  logOptionChange(event: any) {
    const selected: SelectOption[] = event.filter((e: SelectOption) => e.isSelected);
    const levels = selected.map((e) => e.value ?? '');
    this.settingsService.setPreference("log_levels", levels);
    this.selectedLevels.set(levels);
  }

  openLog(logItem: BridgeEvent): void {
    const dialogRef = this.dialog.open(LogViewDialog, {
      width: '600px',
      panelClass: 'overlay',
      data: logItem
    });
  }
}

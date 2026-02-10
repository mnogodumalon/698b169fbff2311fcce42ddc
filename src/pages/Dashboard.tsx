import { useState, useEffect, useMemo } from 'react';
import type { Raeume, Dozenten, Kurse, Teilnehmer, Anmeldungen } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { LivingAppsService, extractRecordId, createRecordUrl } from '@/services/livingAppsService';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import { toast } from 'sonner';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  Plus, Pencil, Trash2, Users, GraduationCap, BookOpen,
  DoorOpen, AlertCircle, RefreshCw, Search,
} from 'lucide-react';

// ── Helpers ──────────────────────────────────────────────────────

function formatDate(d: string | undefined | null): string {
  if (!d) return '–';
  try {
    return format(parseISO(d.split('T')[0]), 'dd.MM.yyyy', { locale: de });
  } catch {
    return d;
  }
}

function formatCurrency(v: number | undefined | null): string {
  if (v == null) return '–';
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(v);
}

function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

// ── Delete confirmation dialog ──────────────────────────────────

function DeleteConfirmDialog({
  open, onOpenChange, label, onConfirm,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  label: string;
  onConfirm: () => Promise<void>;
}) {
  const [deleting, setDeleting] = useState(false);
  async function handleDelete() {
    setDeleting(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } catch {
      toast.error('Fehler beim Löschen');
    } finally {
      setDeleting(false);
    }
  }
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Eintrag löschen?</AlertDialogTitle>
          <AlertDialogDescription>
            Möchtest du {label} wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Abbrechen</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleting}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            {deleting ? 'Löscht…' : 'Löschen'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ── Enrollment capacity bar ─────────────────────────────────────

function EnrollmentBar({ enrolled, max }: { enrolled: number; max: number | undefined | null }) {
  const capacity = max && max > 0 ? max : 0;
  const pct = capacity > 0 ? Math.min((enrolled / capacity) * 100, 100) : 0;
  const color = pct >= 100 ? 'bg-destructive' : pct >= 80 ? 'bg-[hsl(38_92%_50%)]' : 'bg-primary';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-muted-foreground whitespace-nowrap">
        {enrolled}/{capacity || '∞'}
      </span>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// CRUD DIALOGS
// ══════════════════════════════════════════════════════════════════

// ── Räume Dialog ─────────────────────────────────────────────────

function RaeumeDialog({
  open, onOpenChange, record, onSuccess,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  record: Raeume | null;
  onSuccess: () => void;
}) {
  const isEdit = !!record;
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ raumname: '', gebaeude: '', kapazitaet: '' });

  useEffect(() => {
    if (open) {
      setForm({
        raumname: record?.fields.raumname ?? '',
        gebaeude: record?.fields.gebaeude ?? '',
        kapazitaet: record?.fields.kapazitaet?.toString() ?? '',
      });
    }
  }, [open, record]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const fields = {
        raumname: form.raumname,
        gebaeude: form.gebaeude || undefined,
        kapazitaet: form.kapazitaet ? Number(form.kapazitaet) : undefined,
      };
      if (isEdit) {
        await LivingAppsService.updateRaeumeEntry(record!.record_id, fields);
        toast.success('Raum aktualisiert');
      } else {
        await LivingAppsService.createRaeumeEntry(fields);
        toast.success('Raum erstellt');
      }
      onOpenChange(false);
      onSuccess();
    } catch {
      toast.error(`Fehler beim ${isEdit ? 'Speichern' : 'Erstellen'}`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Raum bearbeiten' : 'Neuer Raum'}</DialogTitle>
          <DialogDescription>{isEdit ? 'Rauminformationen ändern' : 'Einen neuen Raum anlegen'}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="raumname">Raumname *</Label>
            <Input id="raumname" value={form.raumname} onChange={e => setForm(p => ({ ...p, raumname: e.target.value }))} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="gebaeude">Gebäude</Label>
            <Input id="gebaeude" value={form.gebaeude} onChange={e => setForm(p => ({ ...p, gebaeude: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="kapazitaet">Kapazität</Label>
            <Input id="kapazitaet" type="number" min="0" value={form.kapazitaet} onChange={e => setForm(p => ({ ...p, kapazitaet: e.target.value }))} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Abbrechen</Button>
            <Button type="submit" disabled={submitting}>{submitting ? 'Speichert…' : isEdit ? 'Speichern' : 'Erstellen'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Dozenten Dialog ──────────────────────────────────────────────

function DozentenDialog({
  open, onOpenChange, record, onSuccess,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  record: Dozenten | null;
  onSuccess: () => void;
}) {
  const isEdit = !!record;
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ vorname: '', nachname: '', email: '', telefon: '', fachgebiet: '' });

  useEffect(() => {
    if (open) {
      setForm({
        vorname: record?.fields.vorname ?? '',
        nachname: record?.fields.nachname ?? '',
        email: record?.fields.email ?? '',
        telefon: record?.fields.telefon ?? '',
        fachgebiet: record?.fields.fachgebiet ?? '',
      });
    }
  }, [open, record]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const fields = {
        vorname: form.vorname,
        nachname: form.nachname,
        email: form.email || undefined,
        telefon: form.telefon || undefined,
        fachgebiet: form.fachgebiet || undefined,
      };
      if (isEdit) {
        await LivingAppsService.updateDozentenEntry(record!.record_id, fields);
        toast.success('Dozent aktualisiert');
      } else {
        await LivingAppsService.createDozentenEntry(fields);
        toast.success('Dozent erstellt');
      }
      onOpenChange(false);
      onSuccess();
    } catch {
      toast.error(`Fehler beim ${isEdit ? 'Speichern' : 'Erstellen'}`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Dozent bearbeiten' : 'Neuer Dozent'}</DialogTitle>
          <DialogDescription>{isEdit ? 'Dozenteninformationen ändern' : 'Einen neuen Dozenten anlegen'}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="doz-vorname">Vorname *</Label>
              <Input id="doz-vorname" value={form.vorname} onChange={e => setForm(p => ({ ...p, vorname: e.target.value }))} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="doz-nachname">Nachname *</Label>
              <Input id="doz-nachname" value={form.nachname} onChange={e => setForm(p => ({ ...p, nachname: e.target.value }))} required />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="doz-email">E-Mail</Label>
            <Input id="doz-email" type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="doz-telefon">Telefon</Label>
            <Input id="doz-telefon" type="tel" value={form.telefon} onChange={e => setForm(p => ({ ...p, telefon: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="doz-fach">Fachgebiet</Label>
            <Input id="doz-fach" value={form.fachgebiet} onChange={e => setForm(p => ({ ...p, fachgebiet: e.target.value }))} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Abbrechen</Button>
            <Button type="submit" disabled={submitting}>{submitting ? 'Speichert…' : isEdit ? 'Speichern' : 'Erstellen'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Kurse Dialog ─────────────────────────────────────────────────

function KurseDialog({
  open, onOpenChange, record, onSuccess, dozenten, raeume,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  record: Kurse | null;
  onSuccess: () => void;
  dozenten: Dozenten[];
  raeume: Raeume[];
}) {
  const isEdit = !!record;
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    titel: '', beschreibung: '', startdatum: '', enddatum: '',
    max_teilnehmer: '', preis: '', dozent: 'none', raum: 'none',
  });

  useEffect(() => {
    if (open) {
      const dozentId = extractRecordId(record?.fields.dozent) ?? 'none';
      const raumId = extractRecordId(record?.fields.raum) ?? 'none';
      setForm({
        titel: record?.fields.titel ?? '',
        beschreibung: record?.fields.beschreibung ?? '',
        startdatum: record?.fields.startdatum?.split('T')[0] ?? todayStr(),
        enddatum: record?.fields.enddatum?.split('T')[0] ?? '',
        max_teilnehmer: record?.fields.max_teilnehmer?.toString() ?? '',
        preis: record?.fields.preis?.toString() ?? '',
        dozent: dozentId,
        raum: raumId,
      });
    }
  }, [open, record]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const fields: Kurse['fields'] = {
        titel: form.titel,
        beschreibung: form.beschreibung || undefined,
        startdatum: form.startdatum || undefined,
        enddatum: form.enddatum || undefined,
        max_teilnehmer: form.max_teilnehmer ? Number(form.max_teilnehmer) : undefined,
        preis: form.preis ? Number(form.preis) : undefined,
        dozent: form.dozent !== 'none' ? createRecordUrl(APP_IDS.DOZENTEN, form.dozent) : undefined,
        raum: form.raum !== 'none' ? createRecordUrl(APP_IDS.RAEUME, form.raum) : undefined,
      };
      if (isEdit) {
        await LivingAppsService.updateKurseEntry(record!.record_id, fields);
        toast.success('Kurs aktualisiert');
      } else {
        await LivingAppsService.createKurseEntry(fields);
        toast.success('Kurs erstellt');
      }
      onOpenChange(false);
      onSuccess();
    } catch {
      toast.error(`Fehler beim ${isEdit ? 'Speichern' : 'Erstellen'}`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Kurs bearbeiten' : 'Neuer Kurs'}</DialogTitle>
          <DialogDescription>{isEdit ? 'Kursinformationen ändern' : 'Einen neuen Kurs anlegen'}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          <div className="space-y-2">
            <Label htmlFor="kurs-titel">Kurstitel *</Label>
            <Input id="kurs-titel" value={form.titel} onChange={e => setForm(p => ({ ...p, titel: e.target.value }))} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="kurs-beschr">Beschreibung</Label>
            <Textarea id="kurs-beschr" value={form.beschreibung} onChange={e => setForm(p => ({ ...p, beschreibung: e.target.value }))} rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="kurs-start">Startdatum *</Label>
              <Input id="kurs-start" type="date" value={form.startdatum} onChange={e => setForm(p => ({ ...p, startdatum: e.target.value }))} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="kurs-end">Enddatum</Label>
              <Input id="kurs-end" type="date" value={form.enddatum} onChange={e => setForm(p => ({ ...p, enddatum: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="kurs-max">Max. Teilnehmer</Label>
              <Input id="kurs-max" type="number" min="1" value={form.max_teilnehmer} onChange={e => setForm(p => ({ ...p, max_teilnehmer: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="kurs-preis">Preis (EUR)</Label>
              <Input id="kurs-preis" type="number" min="0" step="0.01" value={form.preis} onChange={e => setForm(p => ({ ...p, preis: e.target.value }))} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Dozent</Label>
            <Select value={form.dozent} onValueChange={v => setForm(p => ({ ...p, dozent: v }))}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Dozent wählen…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Kein Dozent</SelectItem>
                {dozenten.map(d => (
                  <SelectItem key={d.record_id} value={d.record_id}>
                    {d.fields.vorname} {d.fields.nachname}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Raum</Label>
            <Select value={form.raum} onValueChange={v => setForm(p => ({ ...p, raum: v }))}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Raum wählen…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Kein Raum</SelectItem>
                {raeume.map(r => (
                  <SelectItem key={r.record_id} value={r.record_id}>
                    {r.fields.raumname} {r.fields.gebaeude ? `(${r.fields.gebaeude})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Abbrechen</Button>
            <Button type="submit" disabled={submitting}>{submitting ? 'Speichert…' : isEdit ? 'Speichern' : 'Erstellen'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Teilnehmer Dialog ────────────────────────────────────────────

function TeilnehmerDialog({
  open, onOpenChange, record, onSuccess,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  record: Teilnehmer | null;
  onSuccess: () => void;
}) {
  const isEdit = !!record;
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ vorname: '', nachname: '', email: '', telefon: '', geburtsdatum: '' });

  useEffect(() => {
    if (open) {
      setForm({
        vorname: record?.fields.vorname ?? '',
        nachname: record?.fields.nachname ?? '',
        email: record?.fields.email ?? '',
        telefon: record?.fields.telefon ?? '',
        geburtsdatum: record?.fields.geburtsdatum?.split('T')[0] ?? '',
      });
    }
  }, [open, record]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const fields = {
        vorname: form.vorname,
        nachname: form.nachname,
        email: form.email || undefined,
        telefon: form.telefon || undefined,
        geburtsdatum: form.geburtsdatum || undefined,
      };
      if (isEdit) {
        await LivingAppsService.updateTeilnehmerEntry(record!.record_id, fields);
        toast.success('Teilnehmer aktualisiert');
      } else {
        await LivingAppsService.createTeilnehmerEntry(fields);
        toast.success('Teilnehmer erstellt');
      }
      onOpenChange(false);
      onSuccess();
    } catch {
      toast.error(`Fehler beim ${isEdit ? 'Speichern' : 'Erstellen'}`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Teilnehmer bearbeiten' : 'Neuer Teilnehmer'}</DialogTitle>
          <DialogDescription>{isEdit ? 'Teilnehmerinformationen ändern' : 'Einen neuen Teilnehmer anlegen'}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tn-vorname">Vorname *</Label>
              <Input id="tn-vorname" value={form.vorname} onChange={e => setForm(p => ({ ...p, vorname: e.target.value }))} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tn-nachname">Nachname *</Label>
              <Input id="tn-nachname" value={form.nachname} onChange={e => setForm(p => ({ ...p, nachname: e.target.value }))} required />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="tn-email">E-Mail</Label>
            <Input id="tn-email" type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tn-telefon">Telefon</Label>
            <Input id="tn-telefon" type="tel" value={form.telefon} onChange={e => setForm(p => ({ ...p, telefon: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tn-geb">Geburtsdatum</Label>
            <Input id="tn-geb" type="date" value={form.geburtsdatum} onChange={e => setForm(p => ({ ...p, geburtsdatum: e.target.value }))} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Abbrechen</Button>
            <Button type="submit" disabled={submitting}>{submitting ? 'Speichert…' : isEdit ? 'Speichern' : 'Erstellen'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Anmeldungen Dialog ───────────────────────────────────────────

function AnmeldungenDialog({
  open, onOpenChange, record, onSuccess, teilnehmer, kurse,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  record: Anmeldungen | null;
  onSuccess: () => void;
  teilnehmer: Teilnehmer[];
  kurse: Kurse[];
}) {
  const isEdit = !!record;
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    teilnehmer: 'none', kurs: 'none', anmeldedatum: '', bezahlt: false,
  });

  useEffect(() => {
    if (open) {
      const tnId = extractRecordId(record?.fields.teilnehmer) ?? 'none';
      const kursId = extractRecordId(record?.fields.kurs) ?? 'none';
      setForm({
        teilnehmer: tnId,
        kurs: kursId,
        anmeldedatum: record?.fields.anmeldedatum?.split('T')[0] ?? todayStr(),
        bezahlt: record?.fields.bezahlt ?? false,
      });
    }
  }, [open, record]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const fields: Anmeldungen['fields'] = {
        teilnehmer: form.teilnehmer !== 'none' ? createRecordUrl(APP_IDS.TEILNEHMER, form.teilnehmer) : undefined,
        kurs: form.kurs !== 'none' ? createRecordUrl(APP_IDS.KURSE, form.kurs) : undefined,
        anmeldedatum: form.anmeldedatum || undefined,
        bezahlt: form.bezahlt,
      };
      if (isEdit) {
        await LivingAppsService.updateAnmeldungenEntry(record!.record_id, fields);
        toast.success('Anmeldung aktualisiert');
      } else {
        await LivingAppsService.createAnmeldungenEntry(fields);
        toast.success('Anmeldung erstellt');
      }
      onOpenChange(false);
      onSuccess();
    } catch {
      toast.error(`Fehler beim ${isEdit ? 'Speichern' : 'Erstellen'}`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Anmeldung bearbeiten' : 'Neue Anmeldung'}</DialogTitle>
          <DialogDescription>{isEdit ? 'Anmeldung ändern' : 'Teilnehmer für einen Kurs anmelden'}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Teilnehmer *</Label>
            <Select value={form.teilnehmer} onValueChange={v => setForm(p => ({ ...p, teilnehmer: v }))}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Teilnehmer wählen…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Bitte wählen</SelectItem>
                {teilnehmer.map(t => (
                  <SelectItem key={t.record_id} value={t.record_id}>
                    {t.fields.vorname} {t.fields.nachname}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Kurs *</Label>
            <Select value={form.kurs} onValueChange={v => setForm(p => ({ ...p, kurs: v }))}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Kurs wählen…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Bitte wählen</SelectItem>
                {kurse.map(k => (
                  <SelectItem key={k.record_id} value={k.record_id}>
                    {k.fields.titel}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="anm-datum">Anmeldedatum</Label>
            <Input id="anm-datum" type="date" value={form.anmeldedatum} onChange={e => setForm(p => ({ ...p, anmeldedatum: e.target.value }))} />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="anm-bezahlt" checked={form.bezahlt} onCheckedChange={c => setForm(p => ({ ...p, bezahlt: !!c }))} />
            <Label htmlFor="anm-bezahlt" className="cursor-pointer">Bezahlt</Label>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Abbrechen</Button>
            <Button type="submit" disabled={submitting}>{submitting ? 'Speichert…' : isEdit ? 'Speichern' : 'Erstellen'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ══════════════════════════════════════════════════════════════════
// MAIN DASHBOARD
// ══════════════════════════════════════════════════════════════════

export default function Dashboard() {
  // ── Data state ──
  const [raeume, setRaeume] = useState<Raeume[]>([]);
  const [dozenten, setDozenten] = useState<Dozenten[]>([]);
  const [kurse, setKurse] = useState<Kurse[]>([]);
  const [teilnehmer, setTeilnehmer] = useState<Teilnehmer[]>([]);
  const [anmeldungen, setAnmeldungen] = useState<Anmeldungen[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // ── CRUD dialog state ──
  const [raeumeEdit, setRaeumeEdit] = useState<Raeume | null>(null);
  const [raeumeCreate, setRaeumeCreate] = useState(false);
  const [raeumeDelete, setRaeumeDelete] = useState<Raeume | null>(null);

  const [dozentenEdit, setDozentenEdit] = useState<Dozenten | null>(null);
  const [dozentenCreate, setDozentenCreate] = useState(false);
  const [dozentenDelete, setDozentenDelete] = useState<Dozenten | null>(null);

  const [kurseEdit, setKurseEdit] = useState<Kurse | null>(null);
  const [kurseCreate, setKurseCreate] = useState(false);
  const [kurseDelete, setKurseDelete] = useState<Kurse | null>(null);

  const [teilnehmerEdit, setTeilnehmerEdit] = useState<Teilnehmer | null>(null);
  const [teilnehmerCreate, setTeilnehmerCreate] = useState(false);
  const [teilnehmerDelete, setTeilnehmerDelete] = useState<Teilnehmer | null>(null);

  const [anmeldungenEdit, setAnmeldungenEdit] = useState<Anmeldungen | null>(null);
  const [anmeldungenCreate, setAnmeldungenCreate] = useState(false);
  const [anmeldungenDelete, setAnmeldungenDelete] = useState<Anmeldungen | null>(null);

  // ── Search ──
  const [teilnehmerSearch, setTeilnehmerSearch] = useState('');

  // ── Data fetching ──
  async function loadAll() {
    try {
      setLoading(true);
      setError(null);
      const [r, d, k, t, a] = await Promise.all([
        LivingAppsService.getRaeume(),
        LivingAppsService.getDozenten(),
        LivingAppsService.getKurse(),
        LivingAppsService.getTeilnehmer(),
        LivingAppsService.getAnmeldungen(),
      ]);
      setRaeume(r);
      setDozenten(d);
      setKurse(k);
      setTeilnehmer(t);
      setAnmeldungen(a);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unbekannter Fehler'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadAll(); }, []);

  // ── Computed data ──
  const dozentMap = useMemo(() => {
    const m = new Map<string, Dozenten>();
    dozenten.forEach(d => m.set(d.record_id, d));
    return m;
  }, [dozenten]);

  const raumMap = useMemo(() => {
    const m = new Map<string, Raeume>();
    raeume.forEach(r => m.set(r.record_id, r));
    return m;
  }, [raeume]);

  const teilnehmerMap = useMemo(() => {
    const m = new Map<string, Teilnehmer>();
    teilnehmer.forEach(t => m.set(t.record_id, t));
    return m;
  }, [teilnehmer]);

  const kursMap = useMemo(() => {
    const m = new Map<string, Kurse>();
    kurse.forEach(k => m.set(k.record_id, k));
    return m;
  }, [kurse]);

  const enrollmentByKurs = useMemo(() => {
    const m = new Map<string, number>();
    anmeldungen.forEach(a => {
      const kId = extractRecordId(a.fields.kurs);
      if (!kId) return;
      m.set(kId, (m.get(kId) || 0) + 1);
    });
    return m;
  }, [anmeldungen]);

  const today = todayStr();
  const activeKurse = useMemo(() =>
    kurse.filter(k => !k.fields.enddatum || k.fields.enddatum >= today),
  [kurse, today]);

  const sortedKurse = useMemo(() =>
    [...kurse].sort((a, b) => (b.fields.startdatum ?? '').localeCompare(a.fields.startdatum ?? '')),
  [kurse]);

  const bezahltCount = useMemo(() =>
    anmeldungen.filter(a => a.fields.bezahlt).length,
  [anmeldungen]);

  const paymentPct = anmeldungen.length > 0 ? Math.round((bezahltCount / anmeldungen.length) * 100) : 0;

  const recentAnmeldungen = useMemo(() =>
    [...anmeldungen]
      .sort((a, b) => (b.fields.anmeldedatum ?? b.createdat ?? '').localeCompare(a.fields.anmeldedatum ?? a.createdat ?? ''))
      .slice(0, 5),
  [anmeldungen]);

  const filteredTeilnehmer = useMemo(() => {
    const q = teilnehmerSearch.toLowerCase();
    if (!q) return teilnehmer;
    return teilnehmer.filter(t => {
      const name = `${t.fields.vorname ?? ''} ${t.fields.nachname ?? ''}`.toLowerCase();
      return name.includes(q) || (t.fields.email ?? '').toLowerCase().includes(q);
    });
  }, [teilnehmer, teilnehmerSearch]);

  // ── Loading state ──
  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4 sm:p-8">
        <div className="max-w-[1200px] mx-auto space-y-8">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-40 w-full" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  // ── Error state ──
  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="flex flex-col items-center gap-4 py-8">
            <AlertCircle className="h-12 w-12 text-destructive" />
            <h2 className="text-lg font-semibold">Fehler beim Laden</h2>
            <p className="text-sm text-muted-foreground text-center">{error.message}</p>
            <Button onClick={loadAll} variant="outline" className="gap-2">
              <RefreshCw className="h-4 w-4" /> Erneut versuchen
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Render ──
  return (
    <div className="min-h-screen bg-background animate-in fade-in duration-200">
      {/* ─── Header ─── */}
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-8 h-14 flex items-center justify-between">
          <h1 className="text-lg sm:text-[28px] font-extrabold tracking-tight text-foreground">
            Kursverwaltung
          </h1>
          <Button onClick={() => setAnmeldungenCreate(true)} className="gap-1.5 hidden sm:flex">
            <Plus className="h-4 w-4" /> Neue Anmeldung
          </Button>
        </div>
      </header>

      <main className="max-w-[1200px] mx-auto px-4 sm:px-8 pb-24 sm:pb-8">
        {/* ─── Hero Section ─── */}
        <Card className="mt-6 shadow-sm">
          <CardContent className="p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-6">
              {/* Hero KPI */}
              <div className="sm:w-[40%] flex flex-col items-center sm:items-start">
                <p className="text-5xl sm:text-[56px] font-extrabold leading-none text-foreground">
                  {anmeldungen.length}
                </p>
                <p className="text-sm text-muted-foreground mt-1">Anmeldungen gesamt</p>
                <div className="w-full mt-3">
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${paymentPct}%` }}
                    />
                  </div>
                  <p className="text-sm text-primary font-medium mt-1">{paymentPct}% bezahlt</p>
                </div>
              </div>

              {/* Secondary KPIs */}
              <div className="flex-1 grid grid-cols-3 gap-4">
                <div className="text-center sm:text-left">
                  <p className="text-2xl sm:text-[32px] font-bold text-foreground">{activeKurse.length}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">Aktive Kurse</p>
                </div>
                <div className="text-center sm:text-left">
                  <p className="text-2xl sm:text-[32px] font-bold text-foreground">{teilnehmer.length}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">Teilnehmer</p>
                </div>
                <div className="text-center sm:text-left">
                  <p className="text-2xl sm:text-[32px] font-bold text-foreground">{dozenten.length}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">Dozenten</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ─── Main Content: 2-column on desktop ─── */}
        <div className="mt-8 flex flex-col lg:flex-row gap-8">

          {/* ── Left Column: Kurse ── */}
          <div className="flex-1 lg:w-[65%] min-w-0">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-muted-foreground" />
                Kurse
              </h2>
              <Button size="sm" onClick={() => setKurseCreate(true)} className="gap-1">
                <Plus className="h-4 w-4" /> Neuer Kurs
              </Button>
            </div>

            {sortedKurse.length === 0 ? (
              <Card className="shadow-sm">
                <CardContent className="py-12 text-center">
                  <BookOpen className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">Noch keine Kurse vorhanden</p>
                  <Button size="sm" variant="outline" className="mt-3" onClick={() => setKurseCreate(true)}>
                    Ersten Kurs anlegen
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Desktop table */}
                <div className="hidden md:block">
                  <Card className="shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b bg-muted/50">
                            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Kurstitel</th>
                            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Dozent</th>
                            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Raum</th>
                            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Zeitraum</th>
                            <th className="text-left px-4 py-3 font-medium text-muted-foreground w-36">Auslastung</th>
                            <th className="text-right px-4 py-3 font-medium text-muted-foreground">Preis</th>
                            <th className="px-2 py-3 w-20" />
                          </tr>
                        </thead>
                        <tbody>
                          {sortedKurse.map(k => {
                            const dozentId = extractRecordId(k.fields.dozent);
                            const doz = dozentId ? dozentMap.get(dozentId) : null;
                            const raumId = extractRecordId(k.fields.raum);
                            const raum = raumId ? raumMap.get(raumId) : null;
                            const enrolled = enrollmentByKurs.get(k.record_id) || 0;
                            return (
                              <tr
                                key={k.record_id}
                                className="border-b last:border-0 hover:bg-muted/50 transition-colors cursor-pointer group"
                                onClick={() => setKurseEdit(k)}
                              >
                                <td className="px-4 py-3 font-medium">{k.fields.titel ?? '–'}</td>
                                <td className="px-4 py-3 text-muted-foreground">
                                  {doz ? `${doz.fields.vorname} ${doz.fields.nachname}` : '–'}
                                </td>
                                <td className="px-4 py-3 text-muted-foreground">
                                  {raum ? raum.fields.raumname : '–'}
                                </td>
                                <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                                  {formatDate(k.fields.startdatum)} – {formatDate(k.fields.enddatum)}
                                </td>
                                <td className="px-4 py-3">
                                  <EnrollmentBar enrolled={enrolled} max={k.fields.max_teilnehmer} />
                                </td>
                                <td className="px-4 py-3 text-right">{formatCurrency(k.fields.preis)}</td>
                                <td className="px-2 py-3">
                                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button
                                      variant="ghost" size="icon"
                                      onClick={e => { e.stopPropagation(); setKurseEdit(k); }}
                                      aria-label="Bearbeiten"
                                    >
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost" size="icon"
                                      className="text-destructive hover:text-destructive"
                                      onClick={e => { e.stopPropagation(); setKurseDelete(k); }}
                                      aria-label="Löschen"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                </div>

                {/* Mobile cards */}
                <div className="md:hidden space-y-3">
                  {sortedKurse.map(k => {
                    const dozentId = extractRecordId(k.fields.dozent);
                    const doz = dozentId ? dozentMap.get(dozentId) : null;
                    const raumId = extractRecordId(k.fields.raum);
                    const raum = raumId ? raumMap.get(raumId) : null;
                    const enrolled = enrollmentByKurs.get(k.record_id) || 0;
                    return (
                      <Card
                        key={k.record_id}
                        className="shadow-sm hover:shadow-md transition-shadow cursor-pointer active:scale-[0.98]"
                        onClick={() => setKurseEdit(k)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold truncate">{k.fields.titel ?? '–'}</p>
                              <p className="text-[13px] text-muted-foreground truncate mt-0.5">
                                {doz ? `${doz.fields.vorname} ${doz.fields.nachname}` : '–'}
                                {raum ? ` · ${raum.fields.raumname}` : ''}
                              </p>
                              <p className="text-[13px] text-muted-foreground mt-0.5">
                                {formatDate(k.fields.startdatum)} – {formatDate(k.fields.enddatum)}
                              </p>
                            </div>
                            {k.fields.preis != null && (
                              <Badge variant="secondary" className="ml-2 shrink-0">
                                {formatCurrency(k.fields.preis)}
                              </Badge>
                            )}
                          </div>
                          <div className="mt-3">
                            <EnrollmentBar enrolled={enrolled} max={k.fields.max_teilnehmer} />
                          </div>
                          <div className="flex justify-end gap-1 mt-2">
                            <Button variant="ghost" size="icon" onClick={e => { e.stopPropagation(); setKurseEdit(k); }} aria-label="Bearbeiten">
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={e => { e.stopPropagation(); setKurseDelete(k); }} aria-label="Löschen">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* ── Right Column: Sidebar ── */}
          <div className="lg:w-[35%] space-y-6">

            {/* Recent Anmeldungen */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Letzte Anmeldungen
                </h3>
              </div>
              {recentAnmeldungen.length === 0 ? (
                <p className="text-sm text-muted-foreground">Keine Anmeldungen vorhanden</p>
              ) : (
                <div className="space-y-2">
                  {recentAnmeldungen.map(a => {
                    const tnId = extractRecordId(a.fields.teilnehmer);
                    const tn = tnId ? teilnehmerMap.get(tnId) : null;
                    const kId = extractRecordId(a.fields.kurs);
                    const k = kId ? kursMap.get(kId) : null;
                    return (
                      <div
                        key={a.record_id}
                        className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() => setAnmeldungenEdit(a)}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">
                            {tn ? `${tn.fields.vorname} ${tn.fields.nachname}` : '–'}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {k?.fields.titel ?? '–'} · {formatDate(a.fields.anmeldedatum)}
                          </p>
                        </div>
                        <Badge
                          variant={a.fields.bezahlt ? 'default' : 'outline'}
                          className={a.fields.bezahlt
                            ? 'bg-[hsl(152_60%_40%)] text-white shrink-0 ml-2'
                            : 'text-[hsl(38_92%_50%)] border-[hsl(38_92%_50%)] shrink-0 ml-2'
                          }
                        >
                          {a.fields.bezahlt ? 'Bezahlt' : 'Offen'}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Teilnehmer, Räume, Dozenten in Tabs */}
            <Tabs defaultValue="teilnehmer">
              <TabsList className="w-full">
                <TabsTrigger value="teilnehmer" className="flex-1 gap-1">
                  <Users className="h-3.5 w-3.5" /> Teilnehmer
                </TabsTrigger>
                <TabsTrigger value="raeume" className="flex-1 gap-1">
                  <DoorOpen className="h-3.5 w-3.5" /> Räume
                </TabsTrigger>
                <TabsTrigger value="dozenten" className="flex-1 gap-1">
                  <GraduationCap className="h-3.5 w-3.5" /> Dozenten
                </TabsTrigger>
              </TabsList>

              {/* Teilnehmer Tab */}
              <TabsContent value="teilnehmer">
                <div className="flex items-center gap-2 mb-3 mt-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Suche…"
                      value={teilnehmerSearch}
                      onChange={e => setTeilnehmerSearch(e.target.value)}
                      className="pl-8 h-8"
                    />
                  </div>
                  <Button size="sm" variant="outline" onClick={() => setTeilnehmerCreate(true)} className="shrink-0 h-8">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {filteredTeilnehmer.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    {teilnehmerSearch ? 'Keine Treffer' : 'Keine Teilnehmer vorhanden'}
                  </p>
                ) : (
                  <div className="space-y-1 max-h-64 overflow-y-auto">
                    {filteredTeilnehmer.map(t => (
                      <div
                        key={t.record_id}
                        className="flex items-center justify-between p-2.5 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group"
                        onClick={() => setTeilnehmerEdit(t)}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{t.fields.vorname} {t.fields.nachname}</p>
                          <p className="text-xs text-muted-foreground truncate">{t.fields.email ?? ''}</p>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 sm:opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={e => { e.stopPropagation(); setTeilnehmerEdit(t); }} aria-label="Bearbeiten">
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={e => { e.stopPropagation(); setTeilnehmerDelete(t); }} aria-label="Löschen">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Räume Tab */}
              <TabsContent value="raeume">
                <div className="flex items-center justify-between mb-3 mt-3">
                  <span className="text-sm text-muted-foreground">{raeume.length} Räume</span>
                  <Button size="sm" variant="outline" onClick={() => setRaeumeCreate(true)} className="h-8">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {raeume.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">Keine Räume vorhanden</p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {[...raeume].sort((a, b) => (a.fields.raumname ?? '').localeCompare(b.fields.raumname ?? '')).map(r => (
                      <div
                        key={r.record_id}
                        className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors cursor-pointer group"
                        onClick={() => setRaeumeEdit(r)}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium">{r.fields.raumname ?? '–'}</p>
                          <p className="text-xs text-muted-foreground">
                            {r.fields.gebaeude ?? ''}{r.fields.kapazitaet ? ` · ${r.fields.kapazitaet} Plätze` : ''}
                          </p>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 sm:opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={e => { e.stopPropagation(); setRaeumeEdit(r); }} aria-label="Bearbeiten">
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={e => { e.stopPropagation(); setRaeumeDelete(r); }} aria-label="Löschen">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Dozenten Tab */}
              <TabsContent value="dozenten">
                <div className="flex items-center justify-between mb-3 mt-3">
                  <span className="text-sm text-muted-foreground">{dozenten.length} Dozenten</span>
                  <Button size="sm" variant="outline" onClick={() => setDozentenCreate(true)} className="h-8">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {dozenten.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">Keine Dozenten vorhanden</p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {[...dozenten].sort((a, b) => (a.fields.nachname ?? '').localeCompare(b.fields.nachname ?? '')).map(d => (
                      <div
                        key={d.record_id}
                        className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors cursor-pointer group"
                        onClick={() => setDozentenEdit(d)}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium">{d.fields.vorname} {d.fields.nachname}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {d.fields.fachgebiet ?? ''}{d.fields.email ? ` · ${d.fields.email}` : ''}
                          </p>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 sm:opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={e => { e.stopPropagation(); setDozentenEdit(d); }} aria-label="Bearbeiten">
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={e => { e.stopPropagation(); setDozentenDelete(d); }} aria-label="Löschen">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>

      {/* ─── Mobile FAB ─── */}
      <div className="fixed bottom-0 left-0 right-0 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:hidden bg-background/95 backdrop-blur border-t">
        <Button className="w-full h-12 text-base gap-2" onClick={() => setAnmeldungenCreate(true)}>
          <Plus className="h-5 w-5" /> Neue Anmeldung
        </Button>
      </div>

      {/* ══════════════════════════════════════════════════════════ */}
      {/* ALL CRUD DIALOGS                                         */}
      {/* ══════════════════════════════════════════════════════════ */}

      {/* Räume */}
      <RaeumeDialog
        open={raeumeCreate || !!raeumeEdit}
        onOpenChange={o => { if (!o) { setRaeumeCreate(false); setRaeumeEdit(null); } }}
        record={raeumeEdit}
        onSuccess={loadAll}
      />
      <DeleteConfirmDialog
        open={!!raeumeDelete}
        onOpenChange={o => { if (!o) setRaeumeDelete(null); }}
        label={`den Raum '${raeumeDelete?.fields.raumname ?? ''}'`}
        onConfirm={async () => {
          if (!raeumeDelete) return;
          await LivingAppsService.deleteRaeumeEntry(raeumeDelete.record_id);
          toast.success('Raum gelöscht');
          setRaeumeDelete(null);
          loadAll();
        }}
      />

      {/* Dozenten */}
      <DozentenDialog
        open={dozentenCreate || !!dozentenEdit}
        onOpenChange={o => { if (!o) { setDozentenCreate(false); setDozentenEdit(null); } }}
        record={dozentenEdit}
        onSuccess={loadAll}
      />
      <DeleteConfirmDialog
        open={!!dozentenDelete}
        onOpenChange={o => { if (!o) setDozentenDelete(null); }}
        label={`den Dozenten '${dozentenDelete?.fields.vorname ?? ''} ${dozentenDelete?.fields.nachname ?? ''}'`}
        onConfirm={async () => {
          if (!dozentenDelete) return;
          await LivingAppsService.deleteDozentenEntry(dozentenDelete.record_id);
          toast.success('Dozent gelöscht');
          setDozentenDelete(null);
          loadAll();
        }}
      />

      {/* Kurse */}
      <KurseDialog
        open={kurseCreate || !!kurseEdit}
        onOpenChange={o => { if (!o) { setKurseCreate(false); setKurseEdit(null); } }}
        record={kurseEdit}
        onSuccess={loadAll}
        dozenten={dozenten}
        raeume={raeume}
      />
      <DeleteConfirmDialog
        open={!!kurseDelete}
        onOpenChange={o => { if (!o) setKurseDelete(null); }}
        label={`den Kurs '${kurseDelete?.fields.titel ?? ''}'`}
        onConfirm={async () => {
          if (!kurseDelete) return;
          await LivingAppsService.deleteKurseEntry(kurseDelete.record_id);
          toast.success('Kurs gelöscht');
          setKurseDelete(null);
          loadAll();
        }}
      />

      {/* Teilnehmer */}
      <TeilnehmerDialog
        open={teilnehmerCreate || !!teilnehmerEdit}
        onOpenChange={o => { if (!o) { setTeilnehmerCreate(false); setTeilnehmerEdit(null); } }}
        record={teilnehmerEdit}
        onSuccess={loadAll}
      />
      <DeleteConfirmDialog
        open={!!teilnehmerDelete}
        onOpenChange={o => { if (!o) setTeilnehmerDelete(null); }}
        label={`den Teilnehmer '${teilnehmerDelete?.fields.vorname ?? ''} ${teilnehmerDelete?.fields.nachname ?? ''}'`}
        onConfirm={async () => {
          if (!teilnehmerDelete) return;
          await LivingAppsService.deleteTeilnehmerEntry(teilnehmerDelete.record_id);
          toast.success('Teilnehmer gelöscht');
          setTeilnehmerDelete(null);
          loadAll();
        }}
      />

      {/* Anmeldungen */}
      <AnmeldungenDialog
        open={anmeldungenCreate || !!anmeldungenEdit}
        onOpenChange={o => { if (!o) { setAnmeldungenCreate(false); setAnmeldungenEdit(null); } }}
        record={anmeldungenEdit}
        onSuccess={loadAll}
        teilnehmer={teilnehmer}
        kurse={kurse}
      />
      <DeleteConfirmDialog
        open={!!anmeldungenDelete}
        onOpenChange={o => { if (!o) setAnmeldungenDelete(null); }}
        label="diese Anmeldung"
        onConfirm={async () => {
          if (!anmeldungenDelete) return;
          await LivingAppsService.deleteAnmeldungenEntry(anmeldungenDelete.record_id);
          toast.success('Anmeldung gelöscht');
          setAnmeldungenDelete(null);
          loadAll();
        }}
      />
    </div>
  );
}

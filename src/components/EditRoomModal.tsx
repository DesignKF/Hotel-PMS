import React, { useState, useEffect } from 'react';
import { useBooking } from '../context/BookingContext';
import { Room } from '../types';
import { 
  X, 
  Bed, 
  Layers, 
  DollarSign, 
  FileText, 
  Sparkles, 
  Plus, 
  Trash2, 
  Check, 
  ShieldCheck, 
  Bath, 
  Info,
  Maximize2
} from 'lucide-react';
import { formatMoney } from '../utils/formatters';

interface EditRoomModalProps {
  room: Room | null;
  isOpen: boolean;
  onClose: () => void;
}

const COMMON_AMENITIES_PRESETS = [
  'High-Speed Wi-Fi',
  'Personal USB & Power Outlets',
  'Lockable Storage Box',
  'Solar Hot Water 24/7',
  'Mosquito Netting',
  'Linen & Towels Included',
  'Daily Housekeeping',
  'Air Conditioning',
  'Ceiling Fan',
  'Bed Privacy Curtains',
  'Balcony / Garden View',
  'Work Desk & Chair',
  'Reading Lamp'
];

const BATHROOM_PRESETS = [
  'Shared Ensuite Hot Shower',
  'Private En-suite Bathroom',
  'Shared Hallway Bathroom (Separate M/F)',
  'Private Detached Bathroom'
];

export const EditRoomModal: React.FC<EditRoomModalProps> = ({
  room,
  isOpen,
  onClose
}) => {
  const { updateRoom, currency, exchangeRates } = useBooking();

  const [name, setName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [type, setType] = useState<'dorm' | 'family' | 'triple' | 'private'>('dorm');
  const [singleBeds, setSingleBeds] = useState<number>(0);
  const [bunkBeds, setBunkBeds] = useState<number>(0);
  const [pricePerNightTZS, setPricePerNightTZS] = useState<number>(53000);
  const [tagline, setTagline] = useState('');
  const [description, setDescription] = useState('');
  const [bathroom, setBathroom] = useState('');
  const [amenities, setAmenities] = useState<string[]>([]);
  const [newAmenityInput, setNewAmenityInput] = useState('');

  // Populate when room changes or modal opens
  useEffect(() => {
    if (room) {
      setName(room.name);
      setRoomCode(room.roomCode);
      setType(room.type);
      setSingleBeds(room.singleBeds ?? (room.type === 'dorm' ? 1 : 0));
      setBunkBeds(room.bunkBeds ?? (room.type === 'dorm' ? Math.floor((room.totalBeds - 1) / 2) : 0));
      setPricePerNightTZS(room.pricePerNightTZS);
      setTagline(room.tagline || '');
      setDescription(room.description || '');
      setBathroom(room.bathroom || 'Shared Ensuite Hot Shower');
      setAmenities(room.amenities ? [...room.amenities] : []);
    }
  }, [room, isOpen]);

  if (!isOpen || !room) return null;

  const totalCalculatedBeds = Math.max(1, singleBeds + bunkBeds * 2);

  const handleTogglePresetAmenity = (preset: string) => {
    if (amenities.includes(preset)) {
      setAmenities(prev => prev.filter(a => a !== preset));
    } else {
      setAmenities(prev => [...prev, preset]);
    }
  };

  const handleAddCustomAmenity = () => {
    const trimmed = newAmenityInput.trim();
    if (trimmed && !amenities.includes(trimmed)) {
      setAmenities(prev => [...prev, trimmed]);
      setNewAmenityInput('');
    }
  };

  const handleRemoveAmenity = (item: string) => {
    setAmenities(prev => prev.filter(a => a !== item));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const bedParts: string[] = [];
    if (singleBeds > 0) bedParts.push(`${singleBeds} Single Bed${singleBeds > 1 ? 's' : ''}`);
    if (bunkBeds > 0) bedParts.push(`${bunkBeds} Bunk Bed${bunkBeds > 1 ? 's' : ''}`);
    const bedConfiguration = bedParts.join(' & ') || `${totalCalculatedBeds} Beds`;

    updateRoom(room.id, {
      name: name.trim(),
      roomCode: roomCode.trim().toUpperCase(),
      type,
      singleBeds,
      bunkBeds,
      totalBeds: totalCalculatedBeds,
      pricePerNightTZS: Number(pricePerNightTZS),
      tagline: tagline.trim() || `${bedConfiguration} (Total ${totalCalculatedBeds} beds)`,
      description: description.trim(),
      bathroom: bathroom.trim(),
      amenities,
      bedConfiguration
    });

    onClose();
  };

  const approxUsd = Math.round(pricePerNightTZS / (exchangeRates.USD || 2650));

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div 
        className="card-surface w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl rounded-2xl overflow-hidden border border-strong my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-subtle flex items-center justify-between bg-surface-2 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[var(--primary-gold)]/15 text-[var(--primary-gold)] flex items-center justify-center border border-[var(--primary-gold)]/30">
              <Bed className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-primary">
                  Edit Room Particulars
                </h3>
                <span className="text-xs px-2 py-0.5 rounded-md bg-surface-3 text-primary font-semibold border border-subtle">
                  {room.roomCode}
                </span>
              </div>
              <p className="text-xs text-secondary">
                Update name, bed distribution, description, pricing &amp; amenities for {room.name}.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-secondary hover:text-primary hover:bg-surface-3 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Section 1: Core Room Identity */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-1 border-b border-subtle">
              <span className="text-xs font-bold text-primary uppercase tracking-wider">
                1. Room Identity &amp; Classification
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="sm:col-span-2 space-y-1">
                <label className="font-semibold text-primary">Room Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mawenzi Bunk Dorm"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-surface w-full !text-xs font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-primary">Room Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Room 1 / R1"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value)}
                  className="input-surface w-full !text-xs uppercase font-semibold"
                />
              </div>

              <div className="sm:col-span-2 space-y-1">
                <label className="font-semibold text-primary">Tagline / Subheading</label>
                <input
                  type="text"
                  placeholder="e.g. 1 single bed & 1 bunk bed (Total 3 beds)"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  className="input-surface w-full !text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-primary">Room Type *</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                  className="input-surface w-full !text-xs font-semibold cursor-pointer"
                >
                  <option value="dorm">Dormitory (Shared Beds)</option>
                  <option value="private">Private Room (Entire Room)</option>
                  <option value="triple">Triple Room</option>
                  <option value="family">Family Room</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Bed Amount & Bed Types */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-1 border-b border-subtle">
              <span className="text-xs font-bold text-primary uppercase tracking-wider">
                2. Bed Inventory &amp; Types
              </span>
              <span className="text-xs font-semibold text-[var(--primary-gold)]">
                Total Capacity: {totalCalculatedBeds} Bed{totalCalculatedBeds !== 1 ? 's' : ''}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs bg-surface-2 p-4 rounded-xl border border-subtle">
              {/* Single Beds Counter */}
              <div className="space-y-2">
                <label className="font-semibold text-primary block">Single Beds</label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSingleBeds(Math.max(0, singleBeds - 1))}
                    className="w-8 h-8 rounded-lg bg-surface-3 hover:bg-surface-1 border border-subtle font-bold text-primary flex items-center justify-center cursor-pointer transition-colors"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    value={singleBeds}
                    onChange={(e) => setSingleBeds(Math.max(0, parseInt(e.target.value) || 0))}
                    className="input-surface w-16 text-center font-bold !text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setSingleBeds(singleBeds + 1)}
                    className="w-8 h-8 rounded-lg bg-surface-3 hover:bg-surface-1 border border-subtle font-bold text-primary flex items-center justify-center cursor-pointer transition-colors"
                  >
                    +
                  </button>
                </div>
                <span className="text-[11px] text-tertiary block">1 person each (single mattress)</span>
              </div>

              {/* Bunker Beds Counter */}
              <div className="space-y-2">
                <label className="font-semibold text-primary block">Bunker / Bunk Beds</label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setBunkBeds(Math.max(0, bunkBeds - 1))}
                    className="w-8 h-8 rounded-lg bg-surface-3 hover:bg-surface-1 border border-subtle font-bold text-primary flex items-center justify-center cursor-pointer transition-colors"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    value={bunkBeds}
                    onChange={(e) => setBunkBeds(Math.max(0, parseInt(e.target.value) || 0))}
                    className="input-surface w-16 text-center font-bold !text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setBunkBeds(bunkBeds + 1)}
                    className="w-8 h-8 rounded-lg bg-surface-3 hover:bg-surface-1 border border-subtle font-bold text-primary flex items-center justify-center cursor-pointer transition-colors"
                  >
                    +
                  </button>
                </div>
                <span className="text-[11px] text-tertiary block">2 beds per bunker (upper &amp; lower)</span>
              </div>

              {/* Live Bed Calculation Summary */}
              <div className="space-y-1.5 flex flex-col justify-center bg-surface-1 p-3 rounded-xl border border-subtle">
                <span className="text-[11px] text-tertiary uppercase font-semibold">Total Room Beds</span>
                <div className="text-lg font-bold text-primary flex items-center gap-1.5">
                  <Layers className="w-5 h-5 text-[var(--primary-gold)]" />
                  <span>{totalCalculatedBeds} Beds</span>
                </div>
                <span className="text-[11px] text-secondary">
                  {singleBeds} single + {bunkBeds * 2} bunker beds
                </span>
              </div>
            </div>
          </div>

          {/* Section 3: Nightly Pricing */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-1 border-b border-subtle">
              <span className="text-xs font-bold text-primary uppercase tracking-wider">
                3. Nightly Rate &amp; Currency
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-primary">Nightly Rate (TZS) *</label>
                <div className="relative">
                  <input
                    type="number"
                    step="1000"
                    min="1000"
                    required
                    value={pricePerNightTZS}
                    onChange={(e) => setPricePerNightTZS(Math.max(0, Number(e.target.value)))}
                    className="input-surface w-full !text-sm font-semibold !pl-10"
                  />
                  <span className="text-xs font-semibold text-tertiary absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    TZS
                  </span>
                </div>
                <span className="text-[11px] text-tertiary block">
                  Standard rack rate per bed / night
                </span>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-primary">USD Converted Estimate</label>
                <div className="p-2.5 bg-surface-2 rounded-xl border border-subtle text-primary font-semibold text-sm flex items-center justify-between">
                  <span>≈ ${approxUsd.toLocaleString()} USD</span>
                  <span className="text-xs text-tertiary font-normal">at rate 2,650 TZS</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Description & Bathroom */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-1 border-b border-subtle">
              <span className="text-xs font-bold text-primary uppercase tracking-wider">
                4. Description &amp; Particulars
              </span>
            </div>

            <div className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-primary">Room Description *</label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide an engaging description detailing views, ambience, mattresses, power sockets, and facilities..."
                  className="input-surface w-full !text-xs leading-relaxed"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-primary">Bathroom Arrangement</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={bathroom}
                    onChange={(e) => setBathroom(e.target.value)}
                    placeholder="e.g. Shared Ensuite Hot Shower"
                    className="input-surface flex-1 !text-xs"
                  />
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1.5">
                  {BATHROOM_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setBathroom(preset)}
                      className={`text-[11px] px-2 py-0.5 rounded-lg border transition-colors cursor-pointer ${
                        bathroom === preset
                          ? 'bg-[var(--primary-gold)]/20 text-[var(--primary-gold)] border-[var(--primary-gold)]/40 font-semibold'
                          : 'bg-surface-2 text-secondary border-subtle hover:text-primary'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Section 5: Room Amenities & Features */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-1 border-b border-subtle">
              <span className="text-xs font-bold text-primary uppercase tracking-wider">
                5. Amenities &amp; Features ({amenities.length})
              </span>
            </div>

            <div className="space-y-3 text-xs">
              {/* Presets to click */}
              <div className="space-y-1.5">
                <span className="text-[11px] text-tertiary block font-semibold">
                  Click to add/remove common amenities:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {COMMON_AMENITIES_PRESETS.map((preset) => {
                    const isSelected = amenities.includes(preset);
                    return (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => handleTogglePresetAmenity(preset)}
                        className={`text-xs px-2.5 py-1 rounded-xl border flex items-center gap-1.5 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[var(--primary-gold)] text-[var(--primary-gold-text)] border-[var(--primary-gold)] font-bold shadow-xs'
                            : 'bg-surface-2 text-secondary border-subtle hover:text-primary hover:bg-surface-3'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        <span>{preset}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Add Custom Amenity Tag */}
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="text"
                  placeholder="Add custom amenity (e.g. Garden View Patio)..."
                  value={newAmenityInput}
                  onChange={(e) => setNewAmenityInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCustomAmenity();
                    }
                  }}
                  className="input-surface flex-1 !text-xs"
                />
                <button
                  type="button"
                  onClick={handleAddCustomAmenity}
                  className="btn-secondary !h-9 !px-3 !text-xs shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </div>

              {/* Selected Amenities List */}
              {amenities.length > 0 && (
                <div className="flex flex-wrap gap-1.5 p-3 bg-surface-1 rounded-xl border border-subtle">
                  {amenities.map((item) => (
                    <span
                      key={item}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-2 text-primary text-xs font-medium border border-subtle group"
                    >
                      <Check className="w-3 h-3 text-[var(--status-success-text)]" />
                      <span>{item}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveAmenity(item)}
                        className="text-tertiary hover:text-[var(--status-danger-text)] ml-0.5 cursor-pointer"
                        title="Remove amenity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Modal Footer Controls */}
          <div className="pt-4 border-t border-subtle flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary !h-10 !px-4 !text-xs cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="btn-primary !h-10 !px-6 !text-xs font-bold cursor-pointer"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>Save Room Particulars</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

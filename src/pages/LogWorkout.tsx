import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  Clock, 
  TrendingUp, 
  Mountain, 
  MapPin, 
  Heart, 
  Thermometer,
  FileText,
  Save,
  ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import { ActivityType, TerrainType, ACTIVITY_LABELS, TERRAIN_LABELS } from '@/types/workout';
import { calculatePace, formatPace, parseDuration } from '@/lib/workout-utils';

export default function LogWorkout() {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    time: '',
    activityType: 'running' as ActivityType,
    distance: '',
    duration: '',
    elevationGain: '',
    elevationLoss: '',
    avgHeartRate: '',
    maxHeartRate: '',
    perceivedEffort: 5,
    weather: '',
    temperature: '',
    terrainType: '' as TerrainType | '',
    locationName: '',
    notes: '',
  });

  const calculatedPace = formData.distance && formData.duration
    ? calculatePace(parseFloat(formData.distance), parseDuration(formData.duration))
    : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.distance || !formData.duration || !formData.elevationGain) {
      toast.error('Por favor completa los campos obligatorios');
      return;
    }

    // Here we would save to database
    toast.success('¡Entrenamiento registrado!', {
      description: `${formData.distance} km en ${formData.duration}`,
    });
    
    navigate('/');
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4 mb-8"
      >
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="font-display text-4xl text-foreground">REGISTRAR ENTRENAMIENTO</h1>
          <p className="text-muted-foreground">Añade los detalles de tu sesión</p>
        </div>
      </motion.div>

      <form onSubmit={handleSubmit}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-xl p-6 space-y-6"
        >
          {/* Basic Info */}
          <div className="grid sm:grid-cols-2 gap-6">
            {/* Date */}
            <div className="space-y-2">
              <Label htmlFor="date" className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                Fecha *
              </Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="bg-muted border-border"
              />
            </div>

            {/* Time */}
            <div className="space-y-2">
              <Label htmlFor="time" className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                Hora
              </Label>
              <Input
                id="time"
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                className="bg-muted border-border"
              />
            </div>

            {/* Activity Type */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                Tipo de Actividad *
              </Label>
              <Select
                value={formData.activityType}
                onValueChange={(value: ActivityType) => setFormData({ ...formData, activityType: value })}
              >
                <SelectTrigger className="bg-muted border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ACTIVITY_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Terrain Type */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Mountain className="w-4 h-4 text-muted-foreground" />
                Terreno
              </Label>
              <Select
                value={formData.terrainType}
                onValueChange={(value: TerrainType) => setFormData({ ...formData, terrainType: value })}
              >
                <SelectTrigger className="bg-muted border-border">
                  <SelectValue placeholder="Seleccionar..." />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TERRAIN_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Distance & Duration */}
          <div className="grid sm:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="distance">Distancia (km) *</Label>
              <Input
                id="distance"
                type="number"
                step="0.1"
                min="0"
                placeholder="10.5"
                value={formData.distance}
                onChange={(e) => setFormData({ ...formData, distance: e.target.value })}
                className="bg-muted border-border"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Duración (hh:mm:ss) *</Label>
              <Input
                id="duration"
                type="text"
                placeholder="1:05:30"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                className="bg-muted border-border"
              />
            </div>

            <div className="space-y-2">
              <Label>Ritmo Calculado</Label>
              <div className="h-10 px-3 rounded-lg bg-primary/10 border border-primary/30 flex items-center">
                <span className="font-display text-xl text-primary">
                  {calculatedPace ? `${formatPace(calculatedPace)}/km` : '--:--'}
                </span>
              </div>
            </div>
          </div>

          {/* Elevation */}
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="elevationGain" className="flex items-center gap-2">
                <Mountain className="w-4 h-4 text-secondary" />
                Desnivel Positivo (m) *
              </Label>
              <Input
                id="elevationGain"
                type="number"
                min="0"
                placeholder="250"
                value={formData.elevationGain}
                onChange={(e) => setFormData({ ...formData, elevationGain: e.target.value })}
                className="bg-muted border-border"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="elevationLoss">Desnivel Negativo (m)</Label>
              <Input
                id="elevationLoss"
                type="number"
                min="0"
                placeholder="245"
                value={formData.elevationLoss}
                onChange={(e) => setFormData({ ...formData, elevationLoss: e.target.value })}
                className="bg-muted border-border"
              />
            </div>
          </div>

          {/* Heart Rate */}
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="avgHeartRate" className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-destructive" />
                FC Promedio (bpm)
              </Label>
              <Input
                id="avgHeartRate"
                type="number"
                min="0"
                max="250"
                placeholder="150"
                value={formData.avgHeartRate}
                onChange={(e) => setFormData({ ...formData, avgHeartRate: e.target.value })}
                className="bg-muted border-border"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxHeartRate">FC Máxima (bpm)</Label>
              <Input
                id="maxHeartRate"
                type="number"
                min="0"
                max="250"
                placeholder="175"
                value={formData.maxHeartRate}
                onChange={(e) => setFormData({ ...formData, maxHeartRate: e.target.value })}
                className="bg-muted border-border"
              />
            </div>
          </div>

          {/* Perceived Effort */}
          <div className="space-y-4">
            <Label className="flex items-center justify-between">
              <span>Esfuerzo Percibido</span>
              <span className="font-display text-2xl text-secondary">{formData.perceivedEffort}</span>
            </Label>
            <Slider
              value={[formData.perceivedEffort]}
              onValueChange={([value]) => setFormData({ ...formData, perceivedEffort: value })}
              min={1}
              max={10}
              step={1}
              className="py-2"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Muy fácil</span>
              <span>Máximo esfuerzo</span>
            </div>
          </div>

          {/* Location & Weather */}
          <div className="grid sm:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="locationName" className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-accent" />
                Ubicación
              </Label>
              <Input
                id="locationName"
                type="text"
                placeholder="Sierra de Guadarrama"
                value={formData.locationName}
                onChange={(e) => setFormData({ ...formData, locationName: e.target.value })}
                className="bg-muted border-border"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="weather">Clima</Label>
              <Input
                id="weather"
                type="text"
                placeholder="Soleado"
                value={formData.weather}
                onChange={(e) => setFormData({ ...formData, weather: e.target.value })}
                className="bg-muted border-border"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="temperature" className="flex items-center gap-2">
                <Thermometer className="w-4 h-4 text-muted-foreground" />
                Temperatura (°C)
              </Label>
              <Input
                id="temperature"
                type="number"
                placeholder="15"
                value={formData.temperature}
                onChange={(e) => setFormData({ ...formData, temperature: e.target.value })}
                className="bg-muted border-border"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-muted-foreground" />
              Notas
            </Label>
            <Textarea
              id="notes"
              placeholder="¿Cómo te sentiste? ¿Algo destacable del entrenamiento?"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="bg-muted border-border min-h-24"
            />
          </div>

          {/* Submit */}
          <div className="flex gap-4 pt-4">
            <Button type="button" variant="outline" onClick={() => navigate(-1)} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" variant="trail" className="flex-1">
              <Save className="w-5 h-5" />
              Guardar Entrenamiento
            </Button>
          </div>
        </motion.div>
      </form>
    </div>
  );
}

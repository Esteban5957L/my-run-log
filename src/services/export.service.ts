import { api } from './api';
import type { Activity } from '@/types/activity';
import type { TrainingPlan, PlanSession } from '@/types/plan';

// Utilidades para exportar datos

export const exportService = {
  // Exportar actividades a CSV
  exportActivitiesToCSV(activities: Activity[], filename = 'actividades.csv'): void {
    const headers = [
      'Fecha',
      'Nombre',
      'Tipo',
      'Distancia (km)',
      'Duración (min)',
      'Ritmo (min/km)',
      'Desnivel (m)',
      'FC Media',
      'FC Máx',
      'Calorías',
    ];

    const rows = activities.map(a => [
      new Date(a.date).toLocaleDateString('es-ES'),
      `"${a.name.replace(/"/g, '""')}"`,
      a.activityType,
      (a.distance / 1000).toFixed(2),
      Math.round(a.duration / 60),
      a.avgPace ? (a.avgPace / 60).toFixed(2) : '',
      a.elevationGain || 0,
      a.avgHeartRate || '',
      a.maxHeartRate || '',
      a.calories || '',
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    this.downloadFile(csvContent, filename, 'text/csv;charset=utf-8;');
  },

  // Exportar estadísticas mensuales a CSV
  exportMonthlyStatsToCSV(
    stats: Array<{
      month: string;
      year: number;
      distance: number;
      duration: number;
      workouts: number;
      elevation: number;
      avgPace: number | null;
    }>,
    filename = 'estadisticas_mensuales.csv'
  ): void {
    const headers = ['Mes', 'Año', 'Distancia (km)', 'Tiempo (h)', 'Entrenos', 'Desnivel (m)', 'Ritmo Medio (min/km)'];

    const rows = stats.map(s => [
      s.month,
      s.year,
      (s.distance / 1000).toFixed(2),
      (s.duration / 3600).toFixed(2),
      s.workouts,
      s.elevation,
      s.avgPace ? (s.avgPace / 60).toFixed(2) : '',
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    this.downloadFile(csvContent, filename, 'text/csv;charset=utf-8;');
  },

  // Exportar plan de entrenamiento a formato texto/markdown
  exportPlanToText(plan: TrainingPlan, sessions: PlanSession[]): string {
    let content = `# ${plan.name}\n\n`;
    
    if (plan.description) {
      content += `${plan.description}\n\n`;
    }
    
    content += `**Período:** ${new Date(plan.startDate).toLocaleDateString('es-ES')} - ${new Date(plan.endDate).toLocaleDateString('es-ES')}\n`;
    content += `**Estado:** ${plan.status}\n\n`;
    content += `---\n\n`;
    content += `## Sesiones\n\n`;

    // Agrupar sesiones por semana
    const sessionsByWeek: Record<string, PlanSession[]> = {};
    
    sessions.forEach(session => {
      const date = new Date(session.date);
      const weekStart = new Date(date);
      const dayOfWeek = weekStart.getDay();
      const diff = weekStart.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
      weekStart.setDate(diff);
      const weekKey = weekStart.toISOString().split('T')[0];
      
      if (!sessionsByWeek[weekKey]) {
        sessionsByWeek[weekKey] = [];
      }
      sessionsByWeek[weekKey].push(session);
    });

    Object.entries(sessionsByWeek)
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([weekStart, weekSessions], weekIndex) => {
        content += `### Semana ${weekIndex + 1} (${new Date(weekStart).toLocaleDateString('es-ES')})\n\n`;
        
        weekSessions
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
          .forEach(session => {
            const date = new Date(session.date);
            const dayName = date.toLocaleDateString('es-ES', { weekday: 'long' });
            const status = session.completed ? '✅' : session.skipped ? '⏭️' : '⬜';
            
            content += `${status} **${dayName.charAt(0).toUpperCase() + dayName.slice(1)}** - ${session.title || session.sessionType}\n`;
            
            if (session.description) {
              content += `   ${session.description}\n`;
            }
            
            const details = [];
            if (session.targetDistance) details.push(`${session.targetDistance} km`);
            if (session.targetDuration) details.push(`${Math.round(session.targetDuration / 60)} min`);
            if (session.targetPace) details.push(`${(session.targetPace / 60).toFixed(2)} min/km`);
            
            if (details.length > 0) {
              content += `   📊 ${details.join(' | ')}\n`;
            }
            
            if (session.warmup) content += `   🔥 Calentamiento: ${session.warmup}\n`;
            if (session.mainWorkout) content += `   💪 Principal: ${session.mainWorkout}\n`;
            if (session.cooldown) content += `   ❄️ Vuelta a la calma: ${session.cooldown}\n`;
            
            content += `\n`;
          });
      });

    return content;
  },

  // Generar y descargar plan como archivo de texto
  downloadPlanAsText(plan: TrainingPlan, sessions: PlanSession[], filename?: string): void {
    const content = this.exportPlanToText(plan, sessions);
    const finalFilename = filename || `plan_${plan.name.toLowerCase().replace(/\s+/g, '_')}.md`;
    this.downloadFile(content, finalFilename, 'text/markdown;charset=utf-8;');
  },

  // Generar resumen semanal
  generateWeeklySummary(
    stats: {
      distance: number;
      duration: number;
      workouts: number;
      elevation: number;
    },
    activities: Activity[],
    userName: string
  ): string {
    const now = new Date();
    const weekStart = new Date(now);
    const dayOfWeek = weekStart.getDay();
    const diff = weekStart.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    weekStart.setDate(diff);

    let summary = `# 📊 Resumen Semanal de ${userName}\n`;
    summary += `Semana del ${weekStart.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}\n\n`;
    
    summary += `## 🏃 Estadísticas\n\n`;
    summary += `| Métrica | Valor |\n`;
    summary += `|---------|-------|\n`;
    summary += `| Distancia | ${(stats.distance / 1000).toFixed(1)} km |\n`;
    summary += `| Tiempo | ${Math.floor(stats.duration / 3600)}h ${Math.round((stats.duration % 3600) / 60)}m |\n`;
    summary += `| Entrenos | ${stats.workouts} |\n`;
    summary += `| Desnivel | ${stats.elevation} m |\n\n`;

    if (activities.length > 0) {
      summary += `## 🏅 Actividades\n\n`;
      activities.forEach((a, i) => {
        summary += `${i + 1}. **${a.name}** - ${new Date(a.date).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' })}\n`;
        summary += `   ${(a.distance / 1000).toFixed(1)} km | ${Math.round(a.duration / 60)} min\n\n`;
      });
    }

    summary += `---\n`;
    summary += `*Generado por RUNN.IO el ${now.toLocaleDateString('es-ES')}*\n`;

    return summary;
  },

  // Copiar resumen al portapapeles
  async copyWeeklySummaryToClipboard(
    stats: { distance: number; duration: number; workouts: number; elevation: number },
    activities: Activity[],
    userName: string
  ): Promise<void> {
    const summary = this.generateWeeklySummary(stats, activities, userName);
    await navigator.clipboard.writeText(summary);
  },

  // Utilidad para descargar archivo
  downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },
};

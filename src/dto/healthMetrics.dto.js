class HealthMetricsDTO{
    static formatDateOnly(date) {
        if (!date) return null;
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    static formatDate(date, periodType) {
        if (!date) return null;
        // Для тренировок возвращаем полное время, для остальных - только дату
        if (periodType === 'workout') {
            return date; // Возвращаем как есть (с временем)
        }
        return this.formatDateOnly(date);
    }

    static toList(healthMetric){
        return{
            metricId: healthMetric.id,
            periodType: healthMetric.period_type,
            startDate: this.formatDate(healthMetric.start_date, healthMetric.period_type),
            endDate: this.formatDate(healthMetric.end_date, healthMetric.period_type),
            totalEnergyBurned: healthMetric.total_energy_burned,
            totalStepCount: healthMetric.step_count,
            averageHeartRate: healthMetric.avg_heart_rate
        }
    }

    static toDetail(healthMetric){
        return{
            metricId: healthMetric.id,
            userId: healthMetric.user_id,
            periodType: healthMetric.period_type,
            startDate: this.formatDate(healthMetric.start_date, healthMetric.period_type),
            endDate: this.formatDate(healthMetric.end_date, healthMetric.period_type),
            totalEnergyBurned: healthMetric.total_energy_burned,
            totalStepCount: healthMetric.total_step_count,
            averageHeartRate: healthMetric.average_heart_rate,
            sourceName: healthMetric.source_name,
            createdAt: healthMetric.created_at
        }
    }

    static toPeriodSummary(type, startDate, endDate, avgMetrics, detailedMetrics){
        return{
            periodType: type,
            startDate: this.formatDateOnly(startDate),
            endDate: this.formatDateOnly(endDate),
            averageMetrics: {
                totalEnergyBurned: avgMetrics.total_energy_burned,
                totalStepCount: avgMetrics.total_step_count,
                avgHeartRate: avgMetrics.avg_heart_rate
            },
            totalEntries: detailedMetrics.length,
            detailedMetrics: detailedMetrics.map(m => this.toList(m))
        }

    }

    static toListArray(healthMetrics){
        return healthMetrics.map(m => this.toList(m));
    }
}
module.exports = HealthMetricsDTO;
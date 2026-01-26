class HealthMetricsDTO{
    static toList(healthMetric){
        return{
            metricId: healthMetric.id,
            periodType: healthMetric.period_type,
            startDate: healthMetric.start_date,
            endDate: healthMetric.end_date,
            totalEnergyBurned: healthMetric.total_energy_burned,
            totalStepCount: healthMetric.total_step_count,
            averageHeartRate: healthMetric.average_heart_rate
        }
    }

    static toDetail(healthMetric){
        return{
            metricId: healthMetric.id,
            userId: healthMetric.user_id,
            periodType: healthMetric.period_type,
            startDate: healthMetric.start_date,
            endDate: healthMetric.end_date,
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
            startDate: startDate,
            endDate: endDate,
            averageMetrics: {
                avgEnergyBurned: avgMetrics.avg_energy_burned,
                avgStepCount: avgMetrics.avg_step_count,
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
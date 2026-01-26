class BodyMeasurementDTO{
    static toList(measurement){
        return {
            measurementId: measurement.id,
            date: measurement.date,
            bodyWeight: measurement.body_weight,
            height: measurement.height,
            chest: measurement.chest,
            waist: measurement.waist,
            hips: measurement.hips,
            biceps: measurement.biceps,
            notes: measurement.notes
        };
    }

    static toDetail(measurement){
        return{
            measurementId: measurement.id,
            userId: measurement.user_id,
            userName: measurement.user_name,
            date: measurement.date,
            bodyWeight: measurement.body_weight,
            height: measurement.height,
            chest: measurement.chest,
            waist: measurement.waist,
            hips: measurement.hips,
            biceps: measurement.biceps,
            notes: measurement.notes,
            createdAt: measurement.created_at
        };
    }

    static toProgress(progressData){
        return{
            date: progressData.date,
            value: progressData.value
        }
    }

    static toListArray(measurements){
        return measurements.map(m => this.toList(m));
    }

    static toProgressArray(progressData){
        return progressData.map(p => this.toProgress(p));
    }
}

module.exports = BodyMeasurementDTO;
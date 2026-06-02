async function generateSpherePatientId() {

    const today = new Date();

    const year = today.getFullYear();

    const month = String(
        today.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
        today.getDate()
    ).padStart(2, "0");

    const datePrefix =
        `${year}${month}${day}`;

    const startOfDay = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate()
    );

    const endOfDay = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate() + 1
    );

    const todayCount = await Patient.countDocuments({
        createdAt: {
            $gte: startOfDay,
            $lt: endOfDay
        }
    });

    return `${datePrefix}${todayCount + 1}`;
}


export default generateSpherePatientId;
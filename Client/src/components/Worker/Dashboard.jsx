import '../../assets/css/Worker/Dashboard.css'
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar'
import 'react-circular-progressbar/dist/styles.css'
import { motion } from 'framer-motion'

export const WorkerDashboard = () => {
    const efficiency = 85
    const tasksCompleted = 12
    const totalTasks = 15
    const workerRating = 4.7

    return (
        <div className="container-fluid px-4 py-3 worker-dashboard">
            <div className="row g-4">
                <div className="col-lg-8 d-flex flex-column">
                    <motion.div
                        className="stats-grid"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <div className="card info-card shadow-sm">
                            <div className="card-body d-flex flex-column justify-content-center align-items-center py-4">
                                <div className="card-label">Total Tasks</div>
                                <div className="card-value text-success">10</div>
                                <i className="bi bi-list-task fs-2 text-success mt-2"></i>
                            </div>
                        </div>

                        <div className="card info-card shadow-sm">
                            <div className="card-body d-flex flex-column justify-content-center align-items-center py-4">
                                <div className="card-label">New Tasks</div>
                                <div className="card-value text-warning">10</div>
                                <i className="bi bi-exclamation-circle fs-2 text-warning mt-2"></i>
                            </div>
                        </div>

                        <div className="card info-card shadow-sm">
                            <div className="card-body d-flex flex-column justify-content-center align-items-center py-4">
                                <div className="card-label">Completed Tasks</div>
                                <div className="card-value text-primary">10</div>
                                <i className="bi bi-check-circle fs-2 text-primary mt-2"></i>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        className="performance-stats d-flex justify-content-around align-items-center mt-4 py-4 rounded-3 shadow-sm bg-white"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2, duration: 0.8 }}
                    >
                        <motion.div
                            className="stat-circle"
                            style={{ width: 150 }}
                            whileHover={{ scale: 1.08 }}
                            transition={{ type: "spring", stiffness: 300 }}
                        >
                            <div className="position-relative chart-hover">
                                <CircularProgressbar
                                    value={efficiency}
                                    text={`${efficiency}%`}
                                    styles={buildStyles({
                                        pathColor: '#007bff',
                                        textColor: '#000',
                                        trailColor: '#007bff40',
                                        textSize: '16px',
                                    })}
                                />
                                <i className="bi bi-lightning-charge-fill position-absolute bottom-0 end-0 text-primary fs-5"></i>
                            </div>
                            <div className="text-center mt-2 fw-semibold">Efficiency</div>
                        </motion.div>

                        <motion.div
                            className="stat-circle"
                            style={{ width: 150 }}
                            whileHover={{ scale: 1.08 }}
                            transition={{ type: "spring", stiffness: 300 }}
                        >
                            <div className="position-relative chart-hover">
                                <CircularProgressbar
                                    value={(tasksCompleted / totalTasks) * 100}
                                    text={`${tasksCompleted}/${totalTasks}`}
                                    styles={buildStyles({
                                        pathColor: '#28a745',
                                        textColor: '#000',
                                        trailColor: '#28a7465e',
                                        textSize: '16px',
                                    })}
                                />
                                <i className="bi bi-check-circle-fill position-absolute bottom-0 end-0 text-success fs-5"></i>
                            </div>
                            <div className="text-center mt-2 fw-semibold">Tasks Completed</div>
                        </motion.div>

                        <motion.div
                            className="stat-circle"
                            style={{ width: 150 }}
                            whileHover={{ scale: 1.08 }}
                            transition={{ type: "spring", stiffness: 300 }}
                        >
                            <div className="position-relative chart-hover">
                                <CircularProgressbar
                                    value={(workerRating / 5) * 100}
                                    text={`${workerRating}/5.0`}
                                    styles={buildStyles({
                                        pathColor: '#ff8c00',
                                        textColor: '#000',
                                        trailColor: '#ff8c0040',
                                        textSize: '16px',
                                    })}
                                />
                                <i className="bi bi-star-fill position-absolute bottom-0 end-0 text-warning fs-5"></i>
                            </div>
                            <div className="text-center mt-2 fw-semibold">Worker Rating</div>
                        </motion.div>
                    </motion.div>
                </div>

                <div className="col-lg-4">
                    <motion.div
                        className="notifications h-100 rounded-3 shadow-sm bg-white"
                        initial={{ opacity: 0, x: 40 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <h4 className="text-center p-2 m-0 " style={{backgroundColor:'#83d2ff71',borderRadius:'8px 8px 0 0'}}><i className="bi bi-bell-fill me-1"></i> Notifications</h4>
                        <ul className="list-unstyled px-1 py-3">
                            <li className="p-2 rounded-2 shadow-sm border mx-1 d-flex" >
                                <div className="rounded-circle border px-2 me-1 d-flex align-items-center bg-danger"><i className="bi bi-bell-fill text-white"></i></div>
                                <div className="d-flex flex-column">
                                    Remainder : Complete task
                                    <small className="text-muted ms-2">5 min ago</small>
                                </div>
                            </li>
                        </ul>
                    </motion.div>
                </div>
            </div>
        </div>
    )
}

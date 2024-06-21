import { ExclamationTriangleIcon, CheckCircleIcon, InformationCircleIcon, XCircleIcon } from '@heroicons/react/20/solid'
import PropTypes from 'prop-types'

const alertStyles = {
  success: {
    container: "bg-green-50",
    icon: "text-green-400",
    title: "text-green-800",
    message: "text-green-700",
    IconComponent: CheckCircleIcon,
  },
  info: {
    container: "bg-blue-50",
    icon: "text-blue-400",
    title: "text-blue-800",
    message: "text-blue-700",
    IconComponent: InformationCircleIcon,
  },
  warning: {
    container: "bg-yellow-50",
    icon: "text-yellow-400",
    title: "text-yellow-800",
    message: "text-yellow-700",
    IconComponent: ExclamationTriangleIcon,
  },
  danger: {
    container: "bg-red-50",
    icon: "text-red-400",
    title: "text-red-800",
    message: "text-red-700",
    IconComponent: XCircleIcon,
  },
}

const AquaAlert = ({ type, title, message }) => {
  const styles = alertStyles[type]
  const IconComponent = styles.IconComponent

  return (
    <div className={`rounded-md p-4 ${styles.container}`}>
      <div className="flex">
        <div className="flex-shrink-0">
          <IconComponent className={`h-5 w-5 ${styles.icon}`} aria-hidden="true" />
        </div>
        <div className="ml-3">
          <h3 className={`text-sm font-medium ${styles.title}`}>{title}</h3>
          <div className={`mt-2 text-sm ${styles.message}`}>
            <p>{message}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

Alert.propTypes = {
  type: PropTypes.oneOf(['success', 'info', 'warning', 'danger']).isRequired,
  title: PropTypes.string.isRequired,
  message: PropTypes.string.isRequired,
}

export default AquaAlert

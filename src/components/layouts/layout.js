import AquaFooter from "./footer"
import AquaHeader from "./header"

const AquaLayout = (props) =>{
return(
    <>
<AquaHeader/>
{props.children}
<AquaFooter/>
</>
)}
export default AquaLayout
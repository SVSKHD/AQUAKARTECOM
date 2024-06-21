import AquaFooter from "./footer"
import AquaSeo from "./head/seo"
import AquaHeader from "./header"

const AquaLayout = (props) =>{
return(
    <>
    <AquaSeo seo={props.seo}/>
<AquaHeader/>
{props.children}
<AquaFooter/>
</>
)}
export default AquaLayout
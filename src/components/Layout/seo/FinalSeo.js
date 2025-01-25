import {Head} from "next/head"
const AquaSeo = ({data}) =>{
    const {title} = data
return(
<>
<Head>
    <title>{title}</title>
</Head>
</>
)
}
export default AquaSeo;
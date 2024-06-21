import { useState } from "react"
import AquaReuseDrawer from "@/components/reusables/drawer"
import AquaCompareIndexComponent from "@/pageComponents/compare"


const AquaCompare = () =>{
    const [check , setCheck] = useState(false)
    const seo={
        title:"hello"
    }
return(
    <AquaCompareIndexComponent seo={seo}>
        <AquaReuseDrawer open={check}/>
        <button onClick={()=>setCheck(!check)}>open</button>
    </AquaCompareIndexComponent>
)
}
export default AquaCompare
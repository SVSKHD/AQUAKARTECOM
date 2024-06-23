import { useSelector } from "react-redux"
import AquaReuseDrawer from "../reusables/drawer"
import useCartDrawer from "@/utils/drawer"

const AquaCartDrawer = ({show , close , children})=>{
    const {cartDrawer} = useSelector((state)=>({...state}))
    const {closeCartDrawer} = useCartDrawer()
return(
    <AquaReuseDrawer show={cartDrawer} close={closeCartDrawer}   >
<h1>cart</h1>
    </AquaReuseDrawer>
)
}
export default AquaCartDrawer
import AquaLayout from "@/components/Layout/Layout"
import { useRouter } from "next/router"


const AquaProcessing = () =>{
    const router = useRouter()
    console.log(router.query)
const seo = {title:"Aquacart | processing Order"}
    return(
    <>
    <AquaLayout seo={seo}>
      <h1>hello</h1>
    </AquaLayout>
    </>
)
}
export default AquaProcessing
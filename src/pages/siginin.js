import AquaLayout from "@/components/Layout/Layout";
import { useSelector, useDispatch } from "react-redux";



const AquaSignin = () => {
  const seo = {
    title:"Aquakart | Signin"
  }
  const {userData} = useSelector((state)=>({...state}))
  const dispatch = useDispatch()
  return (
  <AquaLayout seo={seo}>
    <div>
         
    </div>
  </AquaLayout>
  )
};
export default AquaSignin;

"use client"
import {useState, useEffect} from "react"
import AquaLayout from "@/components/Layout/Layout"
import ProductServiceOperations from "@/services/products"
import AQ from "@/assests/logo-white.png";
import Image from "next/image";
import ReusableProductCard from "@/components/cards/ProductCardTwo";


const AquaShopPageComponent = () =>{
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(false)
  const seo={
    title:"Aqua"
  }
  useEffect(()=>{
    setLoading(true)
    ProductServiceOperations.AllProducts().then((res)=>{
      console.log("products", res.data.data)
      setProducts(res.data.data)
    })
    .catch((err)=>{
      console.log(err)
    })
    .finally(()=>{
      setLoading(false)
    })
  },[])
return(
  <AquaLayout>
      {loading ? (
            <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-blue-100 to-blue-300">
              <div className="animate-bounce">
                <Image
                  src={AQ}
                  alt="Loading..."
                  width={80}
                  height={80}
                  className="rounded-full shadow-lg"
                />
              </div>
              <p className="mt-4 text-lg text-blue-900 font-medium animate-pulse">
                Fetching the products for you...
              </p>
            </div>):(
   <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24 lg:max-w-7xl lg:px-8">
   <h2 className="text-3xl font-bold text-gray-900">
  💧 Dive into the Best Deals — Handpicked Products Just for You!
</h2>
   <div>
   <div className="mt-8 grid grid-cols-1 gap-y-12 sm:grid-cols-2 sm:gap-x-6 lg:grid-cols-4 xl:gap-x-8">
    {products.map((r,i)=>(
<ReusableProductCard product={r}/>
    ))}
   </div>
   </div>
   </div>
            )}
  </AquaLayout>
)
}
export default AquaShopPageComponent
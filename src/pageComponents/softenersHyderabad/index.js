import {useEffect, useState} from "react"
import AquaLayout from "@/components/Layout/Layout";
import ArtGallery from "@/components/reusables/artGalery";
import AquaSoftnerOperations from "@/services/softenersHyderabad";

const AquaSoftenerHyderabadComponent = () =>{
    const [imageData, setImageData] = useState([])
    
    const fetchData = async() =>{
        await AquaSoftnerOperations.getSofteners().then((res)=>{
            setImageData(res.data)
        })
    }

    useEffect(()=>{
     fetchData()
    },[imageData])

    const galleryData = [
        {
          area: "Gachibowli",
          description: "",
          images: [
            {
              id: "1",
              url: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&q=80",
              likes: 1245,
              comments: 48,
              location: "Manhattan"
            },
            {
              id: "2",
              url: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&q=80",
              likes: 892,
              comments: 35,
              location: "Brooklyn"
            },
            {
              id: "3",
              url: "https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&q=80",
              likes: 1567,
              comments: 62,
              location: "Queens"
            },
            {
              id: "4",
              url: "https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&q=80",
              likes: 943,
              comments: 41,
              location: "Bronx"
            }
          ],
        }
      ];
return(
    <>
    <AquaLayout>
        <main className="container mx-auto px-4 py-8">
         <ArtGallery sections={imageData} />
         </main>
    </AquaLayout>
    </>
)
}
export default AquaSoftenerHyderabadComponent;

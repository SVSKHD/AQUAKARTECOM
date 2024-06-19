import AquaLayout from "@/components/layouts/defaultLayout"

const AquaHomePage = () =>{
  const seoData = {
    title: "Home Page - My Awesome Site",
    description: "This is the home page of my awesome site. Learn more about our amazing features and offerings.",
    keywords: "home, awesome site, features, offerings",
    author: "Your Name",
    url: "https://www.yoursite.com",
    image: "https://www.yoursite.com/images/og-image.jpg",
  };
return(
  <>
  <AquaLayout seo={seoData}>
    <h1>hello</h1>
  </AquaLayout>
  </>
)
}
export default AquaHomePage
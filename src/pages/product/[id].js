import axios from "axios";

const AquaProduct = (props) => {
  return (
    <>
      <div>hello {props.id}</div>
      <div>Product Name: {JSON.stringify(props?.product)}</div>
      <hr/>
      <div>related : {JSON.stringify(props?.related)}</div>
    </>
  );
};

export async function getServerSideProps(context) {
  const { id } = context.params;

  try {
    // Example API call using Axios
    const response = await axios.get(
      `https://api.aquakart.co.in/v1/product?searchField=slug&value=${id}`
    );
    const product = response.data.data;
    const related = response.data.related;

    return {
      props: {
        id,
        product, // Pass the fetched product data as a prop
        related
      },
    };
  } catch (error) {
    console.error("Error fetching product data:", error);

    return {
      props: {
        id,
        product: null, // Fallback in case of an error
      },
    };
  }
}

export default AquaProduct;

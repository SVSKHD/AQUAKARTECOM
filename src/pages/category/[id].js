import axios from "axios";

const AquaCategory = (props) => {
return(
    <>
        <div>hello {props.id}</div>
        <div>Category Name: {JSON.stringify(props?.category)}</div>
    </>
)
}

export async function getServerSideProps(context) {
    const { id } = context.params;
    try {
        const res = await axios.get(
          `https://api.aquakart.co.in/v1/category-title/${id}`
        );
        const category = res.data.data;
        return {
            props: {
                id,
                category
            }
        }
    } catch (error) {
        console.error("Error fetching category data:", error);
        return {
            props: {
                id,
                category: null
            }
        }
    }
}

export default AquaCategory
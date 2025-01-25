export async function getServerSideProps(context) {
    // Example data fetched from a server-side API
    const data = {
      message: 'This page was rendered on the server',
      timestamp: new Date().toISOString(),
    };
  
    return {
      props: {
        data,
      },
    };
  }
  
  export default function ServerCheck({ data }) {
    return (
      <div>
        <h1>Server-Side Rendering Check</h1>
        <p>{data.message}</p>
        <p>Timestamp: {data.timestamp}</p>
      </div>
    );
  }
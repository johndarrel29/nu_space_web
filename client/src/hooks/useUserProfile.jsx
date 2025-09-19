import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';

function useUserProfile() {
  const queryClient = useQueryClient();
  const { user, token } = useAuth();

  if (!user?.role) {
    throw new Error('user role is missing. Cannot fetch profile.');
  }



  const getUserProfile = async () => {
    const formattedToken = token?.startsWith("Bearer ") ? token.slice(7) : token;

    const headers = {
      "Content-Type": "application/json",
      'Authorization': token ? `Bearer ${formattedToken}` : "",
    }

    try {


      let url = '';

      const role = user?.role || '';



      switch (role) {
        case 'admin':
        case 'super_admin':
        case 'coordinator':
        case 'director':
        case 'avp':
          url = `${process.env.REACT_APP_BASE_URL}/api/admin/user/fetchAdminProfile`;
          break;
        case 'rso_representative':
          url = `${process.env.REACT_APP_BASE_URL}/api/rsoRep/rso/rsoProfile`;
          break;
        default:
          console.warn(`No URL defined for role: ${role}`);

      }



      const res = await fetch(url, {
        method: 'GET',
        credentials: 'include',
        headers: headers,
      });

      if (!res.ok) throw new Error(`Failed to fetch profile: ${res.status}`);
      const data = await res.json();
      return data;

    } catch (error) {
      console.error('Error fetching user profile:', error);
    }

  }

  const deleteOfficer = async (officerId) => {
    const token = localStorage.getItem("token");
    const formattedToken = token?.startsWith("Bearer ") ? token.slice(7) : token;

    const headers = {
      "Content-Type": "application/json",
      "Authorization": token ? `Bearer ${formattedToken}` : "",
    };

    try {
      const response = await fetch(`${process.env.REACT_APP_BASE_URL}/api/rsoRep/rso/deleteRSOOfficer/${officerId}`, {
        method: "DELETE",
        headers,
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status} - ${response.statusText}`);
      }


      return response.json();
    } catch (err) {
      console.error("Error deleting officer:", err);
    }
  }


  const {
    data: userProfile,
    error: userProfileError,
    isLoading: isUserProfileLoading,
    isError: isUserProfileError,
    refetch: refetchUserProfile,
  } = useQuery({
    queryKey: ['userProfileByRole'],
    queryFn: getUserProfile,
    staleTime: Infinity,
    cacheTime: Infinity,
  }
  );

  const {
    mutate: deleteOfficerMutate,
    isLoading: isDeleting,
    isError: isDeleteError,
    isSuccess: isDeleteSuccess,
  } = useMutation({
    mutationFn: deleteOfficer,
    onSuccess: () => {
      queryClient.invalidateQueries(["membersData"]);
      refetchUserProfile();

    },
    onError: (err) => {
      console.error("Error deleting officer:", err);
    }
  });




  return {
    userProfile,
    userProfileError,
    isUserProfileLoading,
    isUserProfileError,
    refetchUserProfile,

    deleteOfficerMutate,
    isDeleting,
    isDeleteError,
    isDeleteSuccess,
  };
}

export default useUserProfile;

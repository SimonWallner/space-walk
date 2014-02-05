using UnityEngine;
using System.Collections;

public static class MathUtils {


	/**
	  * Inverted box that is 0 inside [-domain, +domain] and 1 else
	  */
	public static float InvertedBox(float domain, float value)
	{
		return System.Convert.ToSingle((value < -domain) || (value > domain));
	}
	
	/**
	 * Returns 0 inside [-deadZone, +deadZone], value else
	 */
	public static float DeadZone(float deadZone, float value)
	{
		return value * InvertedBox(deadZone, value);
	}

	/**
	 * map a value from the interval [a, b] to [r, s]. Values outside 
	 * of [a, b] are mapped accordingly.
	 */
	public static float Map(float a, float b, float r, float s, float value) {
		var ratio = (value - a) / (b - a);
		return r + (s - r) * ratio;
	}
	
	public static float FindQuaternionTwist(Quaternion q, Vector3 axis)
	{
		axis.Normalize();
		
		
		//get the plane the axis is a normal of
		Vector3 orthonormal1, orthonormal2;
		MathUtils.FindOrthonormals(axis, out orthonormal1, out orthonormal2);
		
		
		Vector3 transformed = q * orthonormal1;
		
		
		//project transformed vector onto plane
		Vector3 flattened = transformed - (Vector3.Dot(transformed, axis) * axis);
		flattened.Normalize();
		
		
		//get angle between original vector and projected transform to get angle around normal
		float a = Mathf.Acos(Mathf.Abs(Vector3.Dot(orthonormal1, flattened)));
		Vector3 cross = Vector3.Cross(orthonormal1, flattened);
		cross.Normalize();
		
		float sign = Vector3.Dot (cross, axis);
		a *= sign;
		return a;
	}
	
	public static float FindQuaternionRotation(Quaternion q, Vector3 axis)
	{
		axis.Normalize();
		
		
		//get the plane the axis is a normal of
		Vector3 orthonormal1, orthonormal2;
		MathUtils.FindOrthonormals(axis, out orthonormal1, out orthonormal2);
		
		
		Vector3 transformed = q * orthonormal1;
		
		
		//project transformed vector onto plane
		Vector3 flattened = transformed - (Vector3.Dot(transformed, axis) * axis);
		flattened.Normalize();
		
		
		//get angle between original vector and projected transform to get angle around normal
		float a = Mathf.Acos(Vector3.Dot(orthonormal1, flattened));
		Vector3 cross = Vector3.Cross(orthonormal1, flattened);
		cross.Normalize();
		
		float sign = Vector3.Dot (cross, axis);
		a *= sign;
		return a;
	}

	public static void FindOrthonormals(Vector3 normal, out Vector3 orthonormal1, out Vector3 orthonormal2)
	{

		Quaternion orthoX = Quaternion.AngleAxis(Mathf.PI / 2f, new Vector3(1f,0,0));
		Quaternion orthoY = Quaternion.AngleAxis(Mathf.PI / 2f, new Vector3(0,1f,0));
		Vector3 w = orthoX * normal;
		float dot = Vector3.Dot(normal, w);
		if (Mathf.Abs(dot) > 0.6)
		{
			w = orthoY * normal;
		}
		w.Normalize();
		
		orthonormal1 = Vector3.Cross(normal, w);
		orthonormal1.Normalize();
		orthonormal2 = Vector3.Cross(normal, orthonormal1);
		orthonormal2.Normalize();
	}
}

Shader "Custom/terrain shader" {
	Properties {
		_MainTex ("Base (RGB)", 2D) = "white" {}
		_BaseColor ("Base Color", Color) = (1, 1, 1, 0.5)
		_BaseHeight ("Base Hight", Float) = 0
		_TopColor ("Top Color", Color) = (1, 1, 1, 0.5)
		_TopHeight ("Top Height", Float) = 100
		_Variation ("random variation", Range (0, 1)) = 0.1
	}
	
	SubShader {
		Tags { "RenderType" = "Opaque" }
		
		Pass {
			CGPROGRAM
			#pragma vertex vert
			#pragma fragment frag
			#pragma glsl
			#pragma target 3.0
			
			
			sampler2D _MainTex;
			float2 _MainTex_ST;
			float4 _BaseColor;
			float _BaseHeight;
			float4 _TopColor;
			float _TopHeight;
			float _Variation;

			struct VSInput
			{
				float2 uv : TEXCOORD0;
				float4 vertex : POSITION;
				float3 normal : NORMAL;
			};
			
			struct VSOutput
			{
				float4 pos : POSITION;
//				float3 normal : NORMAL;
				float4 color : COLOR;
			};

			VSOutput vert(VSInput input)
			{
				VSOutput output;
				
				output.pos = mul(UNITY_MATRIX_MVP, input.vertex);
				float4 worldPos = mul(_Object2World, input.vertex);
				float3 normal = normalize(float3(mul(float4(input.normal, 0), _World2Object)));
				
				float randomFactor = normal.x * normal.y * normal.z;
				
				float heightFactor = smoothstep(_BaseHeight, _TopHeight, worldPos.y);
				
				output.color = lerp(_BaseColor, _TopColor, heightFactor);
				
				float4 tex = tex2D(_MainTex, input.uv * _MainTex_ST * randomFactor.xx);
							
				output.color = lerp(output.color, tex,  _Variation.xxxx);
				
				output.color *= saturate(dot(normal, normalize(_WorldSpaceLightPos0.xyz)));
				
				
				return output;
			}
			
			float4 frag(VSOutput input) : COLOR 
			{
				return input.color;
			}

			ENDCG
		}
	} 
	FallBack "Diffuse"
}
